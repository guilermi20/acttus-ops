// Webhook do GHL → cria o cliente no Acttus OS e avisa o grupo do WhatsApp.
//
// Fluxo: o lead é marcado como GANHO no CRM → o workflow do GHL chama
// POST /api/v1/webhooks/ghl (autenticado por chave de API, escopo write) →
// nasce um cliente em "onboarding" → o grupo do marketing recebe o aviso de
// novo onboarding com o link do Calendly.
//
// O formato do payload do GHL muda conforme o gatilho e conforme os campos
// personalizados da subconta. Por isso: (1) o payload inteiro é gravado em
// webhook_events ANTES de qualquer processamento — é dele que sai o mapeamento
// fino dos campos do card, depois de um disparo real; (2) a extração abaixo é
// tolerante, tentando os nomes mais comuns e desistindo em silêncio.
import { sql } from './db.js';
import { sendGroup } from './whatsapp.js';
import crypto from 'node:crypto';

// Mesma reunião das gravações: quem grava é quem faz o onboarding.
const CALENDLY_FALLBACK = 'https://calendly.com/contato-acttusco/gravacao';

function str(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

// Primeiro valor não vazio entre vários caminhos possíveis do payload.
function pick(obj, paths) {
  for (const path of paths) {
    let cur = obj;
    for (const part of path.split('.')) {
      if (cur == null || typeof cur !== 'object') { cur = null; break; }
      cur = cur[part];
    }
    const v = str(cur);
    if (v) return v;
  }
  return '';
}

// Nome do cliente: preferimos a empresa (é ela que vira "cliente da agência");
// caindo para o nome da oportunidade e, por último, o nome da pessoa.
export function extractClientName(b) {
  const direct = pick(b, [
    'companyName', 'company_name', 'company', 'businessName', 'business_name',
    'contact.companyName', 'contact.company_name', 'contact.company',
    'opportunity.name', 'opportunity_name',
  ]);
  if (direct) return direct.slice(0, 200);
  const full = pick(b, ['full_name', 'fullName', 'contact.full_name', 'contact.fullName', 'contact.name', 'name']);
  if (full) return full.slice(0, 200);
  const first = pick(b, ['first_name', 'firstName', 'contact.first_name', 'contact.firstName']);
  const last = pick(b, ['last_name', 'lastName', 'contact.last_name', 'contact.lastName']);
  return (first + ' ' + last).trim().slice(0, 200);
}

// Id estável do evento no GHL — é o que evita cliente duplicado quando o GHL
// reenvia o mesmo webhook.
export function extractGhlId(b) {
  return pick(b, [
    'opportunity.id', 'opportunityId', 'opportunity_id',
    'contact.id', 'contactId', 'contact_id', 'id',
  ]).slice(0, 120);
}

function eventName(b) {
  return pick(b, ['type', 'event', 'eventType', 'workflow.name', 'webhook_event']).slice(0, 120) || 'opportunity_won';
}

function baseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');
  return proto + '://' + host;
}

// Corpo já vem parseado pela Vercel quando o Content-Type é JSON; se vier como
// string (form-urlencoded mal declarado, por exemplo), tentamos o parse.
function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = { raw: req.body }; } }
  return b && typeof b === 'object' ? b : {};
}

async function logEvent(event, payload, status, clientId, error) {
  try {
    const { rows } = await sql(
      `insert into webhook_events (source, event, payload, client_id, status, error)
       values ('ghl', $1, $2::jsonb, $3, $4, $5) returning id`,
      [event, JSON.stringify(payload), clientId || null, status, error || null]
    );
    return rows[0].id;
  } catch (e) {
    return null; // o log não pode derrubar o webhook
  }
}

async function setEvent(id, status, clientId, error) {
  if (!id) return;
  try {
    await sql('update webhook_events set status = $1, client_id = coalesce($2, client_id), error = $3 where id = $4',
      [status, clientId || null, error || null, id]);
  } catch (e) { /* idem */ }
}

// Aviso de novo onboarding no grupo (menciona todos, como os demais avisos).
async function announce(client, req) {
  const calendly = process.env.CALENDLY_ONBOARDING_URL || CALENDLY_FALLBACK;
  const panel = client.share_token ? baseUrl(req) + '/cliente?t=' + client.share_token : '';
  const msg = '🎉 *Novo onboarding* — ' + client.name + '\n' +
    'Cliente fechado no CRM e já criado no Acttus OS.\n\n' +
    '📅 Agende a reunião de onboarding: ' + calendly +
    (panel ? '\n🔗 Painel do cliente: ' + panel : '');
  await sendGroup(msg);
}

// Handler da rota POST /api/v1/webhooks/ghl (chamado pelo api/gateway.js).
// Responde 200 mesmo quando não dá para criar o cliente: um erro faria o GHL
// reenviar o evento indefinidamente. O que aconteceu fica em webhook_events.
export async function ghlWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST /api/v1/webhooks/ghl' });
  }
  const body = readBody(req);
  const event = eventName(body);
  const eventId = await logEvent(event, body, 'received', null, null);

  const name = extractClientName(body);
  const ghlId = extractGhlId(body);

  if (!name) {
    await setEvent(eventId, 'skipped', null, 'não foi possível identificar o nome do cliente no payload');
    return res.status(200).json({ ok: false, event_id: eventId, reason: 'Sem nome de cliente no payload. Ele foi gravado em /api/v1/webhook-events para conferência.' });
  }

  try {
    // Já conhecemos este cliente? (pelo id do GHL ou pelo nome, que é unique)
    const dup = await sql(
      'select id, name, share_token from clients where (ghl_id is not null and ghl_id = $1) or lower(name) = lower($2) limit 1',
      [ghlId || null, name]
    );
    if (dup.rows.length) {
      const c = dup.rows[0];
      // Carimba o ghl_id se o cliente foi criado à mão antes do webhook chegar.
      if (ghlId) { try { await sql('update clients set ghl_id = $1 where id = $2 and ghl_id is null', [ghlId, c.id]); } catch (e) {} }
      await setEvent(eventId, 'duplicate', c.id, null);
      return res.status(200).json({ ok: true, duplicate: true, client: { id: c.id, name: c.name }, event_id: eventId });
    }

    const token = crypto.randomBytes(16).toString('hex');
    const ins = await sql(
      `insert into clients (name, stage, share_token, ghl_id) values ($1, 'onboarding', $2, $3)
       returning id, name, share_token`,
      [name, token, ghlId || null]
    );
    const client = ins.rows[0];

    let waError = null;
    try { await announce(client, req); }
    catch (e) { waError = 'WhatsApp: ' + String(e.message || e); }

    try {
      await sql('insert into notifications (text, kind, whatsapp_sent) values ($1, $2, $3)',
        ['Novo onboarding: ' + client.name + ' (fechado no CRM)', 'onboarding', !waError]);
    } catch (e) {}

    await setEvent(eventId, waError ? 'created_no_whatsapp' : 'created', client.id, waError);
    return res.status(200).json({ ok: true, client: { id: client.id, name: client.name }, whatsapp: !waError, event_id: eventId });
  } catch (e) {
    const msg = String(e.message || e);
    await setEvent(eventId, 'error', null, msg);
    return res.status(200).json({ ok: false, error: msg, event_id: eventId });
  }
}
