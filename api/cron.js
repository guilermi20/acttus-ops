import { sql } from '../lib/db.js';
import { sendGroup, sendDM } from '../lib/whatsapp.js';
import { list, del } from '@vercel/blob';

const OPEN = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação'];
const ICON = { 'Agendado': '🗓️', 'Em produção': '🛠️', 'Aguardando aprovação': '👀', 'Modificação': '✏️', 'Finalizado': '✅', 'Postado': '📣' };

function monthLabel(ym) {
  const M = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const p = String(ym).split('-'); return (M[+p[1] - 1] || p[1]) + ' ' + p[0];
}

const POSTS = `select p.title, p.status, p.pub_time,
    to_char(p.due_date,'DD/MM') as due, to_char(p.pub_date,'DD/MM') as pub,
    c.name as client, u.id as uid, u.name as resp, u.phone
  from posts p
  left join clients c on c.id = p.client_id
  left join users u on u.id = p.responsible_id`;

const label = (r) => (ICON[r.status] || '•') + ' *' + r.title + '* — ' + (r.client || 'sem cliente');
const section = (title, rows, fmt) => (rows.length ? '*' + title + ' (' + rows.length + ')*\n' + rows.map(fmt).join('\n') : null);

// Distribui as linhas por responsável. Quem não tem responsável — ou tem, mas sem
// telefone cadastrado — não pode receber DM: cai no balde de órfãos, que vai pro
// grupo. Assim nenhuma demanda some por falta de destinatário.
function router() {
  const people = new Map(); // uid → { name, phone, ...listas }
  const orphans = [];
  return {
    people, orphans,
    put(row, key) {
      if (!row.uid || !row.phone) { orphans.push({ row, key }); return; }
      let p = people.get(row.uid);
      if (!p) { p = { name: row.resp, phone: row.phone, overdue: [], soon: [], finalized: [], routines: [], tomorrow: [] }; people.set(row.uid, p); }
      p[key].push(row);
    },
  };
}

// Manda o balde de órfãos pro grupo, com o motivo de não ter virado DM.
async function flushOrphans(orphans, head, tail) {
  if (!orphans.length) return 0;
  const lines = orphans.map((o) => label(o.row) + (tail ? tail(o) : '') +
    (o.row.resp ? ' · ⚠️ ' + o.row.resp + ' está sem telefone' : ' · ⚠️ sem responsável'));
  await sendGroup(head + '\n' + lines.join('\n'));
  return orphans.length;
}

// Resumo da manhã: UM DM por pessoa com tudo que é dela (rotinas vencidas,
// demandas atrasadas, o que vence em 2 dias e o que está pronto pra publicar).
async function morningDMs() {
  const overdue = (await sql(POSTS + `
    where p.due_date is not null and p.due_date <= current_date and p.status = any($1)
    order by p.due_date asc limit 150`, [OPEN])).rows;
  const soon = (await sql(POSTS + `
    where p.due_date = current_date + 2 and p.status = any($1)
    order by p.due_date asc limit 150`, [OPEN])).rows;
  const finalized = (await sql(POSTS + `
    where p.status = 'Finalizado' order by u.name nulls last limit 80`)).rows;
  const routines = (await sql(`select r.title, to_char(r.due_date,'DD/MM') as due,
      u.id as uid, u.name as resp, u.phone
    from routines r join users u on u.id = r.owner_id
    where r.due_date is not null and r.due_date <= current_date and r.done = false
    order by r.due_date asc`)).rows;

  const R = router();
  overdue.forEach((r) => R.put(r, 'overdue'));
  soon.forEach((r) => R.put(r, 'soon'));
  finalized.forEach((r) => R.put(r, 'finalized'));
  // Rotina é pessoal: sem telefone não tem pra onde mandar, e não faz sentido no grupo.
  routines.forEach((r) => { if (r.phone) R.put(r, 'routines'); });

  let dms = 0;
  for (const p of R.people.values()) {
    const blocks = [
      section('⏰ Atrasados / vence hoje', p.overdue, (r) => label(r) + ' — vence ' + r.due),
      section('🟡 Faltam 2 dias', p.soon, (r) => label(r) + ' — vence ' + r.due),
      section('📣 Prontos para publicar', p.finalized, (r) => label(r) + (r.pub_time ? ' · ' + r.pub_time : '')),
      section('📋 Rotinas vencidas', p.routines, (r) => '• ' + r.title + ' (até ' + r.due + ')'),
    ].filter(Boolean);
    if (!blocks.length) continue;
    const msg = '☀️ *Bom dia, ' + (p.name || '') + '!*\nSeu resumo de hoje:\n\n' + blocks.join('\n\n');
    try { await sendDM(p.phone, msg); dms++; } catch (e) { /* uma falha não derruba os outros */ }
  }

  const LBL = { overdue: 'atrasado/hoje', soon: 'faltam 2 dias', finalized: 'pronto p/ publicar' };
  const orphans = await flushOrphans(R.orphans,
    '⚠️ *Demandas sem DM (' + R.orphans.length + ')*\nNinguém foi avisado no privado — defina o responsável (ou cadastre o telefone dele):\n',
    (o) => (LBL[o.key] ? ' _(' + LBL[o.key] + ')_' : ''));

  const note = (text) => sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)', [text, 'due', true]);
  try {
    if (overdue.length) await note(overdue.length + ' demanda(s) a concluir');
    if (soon.length) await note(soon.length + ' post(s) a 2 dias do prazo');
    if (finalized.length) await note(finalized.length + ' finalizado(s) aguardando publicação');
  } catch (e) {}

  return { posts: overdue.length, soon: soon.length, finalized: finalized.length, routines: routines.length, dms, orphans };
}

// No dia 1 de cada mês: cria um lembrete por cliente p/ planejar o calendário, atribuído à Chacon.
async function monthlyClientReminders() {
  const info = (await sql("select to_char(current_date,'YYYY-MM') as ym, extract(day from current_date)::int as day")).rows[0];
  if (info.day !== 1) return { reminders: 0 };
  const chac = await sql("select id from users where lower(name) = 'chacon' or lower(email) like 'chacon%' limit 1");
  if (!chac.rows.length) return { reminders: 0 };
  const owner = chac.rows[0].id;
  const clients = await sql('select name from clients order by name');
  let created = 0;
  for (const c of clients.rows) {
    const title = 'Planejar calendário de ' + monthLabel(info.ym) + ' — ' + c.name;
    const ex = await sql('select 1 from routines where owner_id = $1 and title = $2 limit 1', [owner, title]);
    if (ex.rows.length) continue;
    await sql("insert into routines (owner_id, title, due_date) values ($1, $2, (date_trunc('month', current_date) + interval '4 day')::date)", [owner, title]);
    created++;
  }
  return { reminders: created };
}

// Recap do dia (18h seg–sex): o que PUBLICA amanhã e em que status está,
// no privado de cada responsável.
async function digest() {
  const rows = (await sql(POSTS + `
    where p.pub_date = current_date + 1
    order by p.pub_time nulls last, c.name nulls last limit 150`)).rows;
  if (!rows.length) return { tomorrow: 0, dms: 0, orphans: 0 };

  const day = rows[0].pub;
  const R = router();
  rows.forEach((r) => R.put(r, 'tomorrow'));

  const line = (r) => label(r) + (r.pub_time ? ' · ' + r.pub_time : '') + ' · _' + r.status + '_';
  let dms = 0;
  for (const p of R.people.values()) {
    const msg = '🌙 *Amanhã (' + day + ') você publica ' + p.tomorrow.length + ':*\n\n' + p.tomorrow.map(line).join('\n');
    try { await sendDM(p.phone, msg); dms++; } catch (e) {}
  }

  const orphans = await flushOrphans(R.orphans,
    '🌙 *Publica amanhã (' + day + ') e está sem DM (' + R.orphans.length + ')*\n',
    (o) => (o.row.pub_time ? ' · ' + o.row.pub_time : '') + ' · _' + o.row.status + '_');

  try { await sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)', ['Amanhã (' + day + '): ' + rows.length + ' post(s) publicando', 'digest', true]); } catch (e) {}
  return { tomorrow: rows.length, dms, orphans };
}

// Faxina de storage: apaga do Vercel Blob os arquivos que nenhum registro referencia
// (uploads abandonados, posts/itens excluídos etc.). Só remove órfãos com +6h, para
// não correr o risco de apagar algo de um upload em andamento.
async function blobGC() {
  const live = new Set();
  const add = (arr) => { (arr || []).forEach((x) => { if (x && x.url) live.add(x.url); }); };
  (await sql('select media from posts')).rows.forEach((p) => add(p.media));
  (await sql('select attachments from meetings')).rows.forEach((m) => add(m.attachments));
  (await sql('select attachments from projects')).rows.forEach((p) => add(p.attachments));
  (await sql('select cover_url, avatar_url from clients')).rows.forEach((c) => { if (c.cover_url) live.add(c.cover_url); if (c.avatar_url) live.add(c.avatar_url); });
  const cutoff = Date.now() - 6 * 3600 * 1000;
  let cursor, deleted = 0, freed = 0;
  do {
    const r = await list({ cursor, limit: 1000 });
    cursor = r.cursor;
    for (const b of r.blobs) {
      if (live.has(b.url)) continue;
      const ts = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      if (ts && ts > cutoff) continue; // recente demais: pode estar em uso num modal aberto
      try { await del(b.url); deleted++; freed += b.size || 0; } catch (e) {}
    }
  } while (cursor);
  if (deleted) { try { await sql('insert into notifications (text, kind) values ($1,$2)', ['Faxina de storage: ' + deleted + ' arquivo(s) órfão(s) removido(s) (' + (freed / 1048576).toFixed(1) + ' MB)', 'info']); } catch (e) {} }
  return { blobsDeleted: deleted, mbFreed: +(freed / 1048576).toFixed(1) };
}

// Rotina da manhã: junta tudo (cabe no limite de crons do Hobby).
async function morning() {
  const out = {};
  try { Object.assign(out, await morningDMs()); } catch (e) { out.morningErr = String(e.message || e); }
  try { const m = await monthlyClientReminders(); out.monthly = m.reminders; } catch (e) {}
  try { out.blobGC = await blobGC(); } catch (e) { out.blobGCErr = String(e.message || e); }
  return out;
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const provided = (req.headers['authorization'] || '').replace('Bearer ', '') || (req.query && req.query.secret);
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });
  const job = (req.query && req.query.job) || 'morning';
  try {
    let r;
    if (job === 'digest') r = await digest();
    else if (job === 'dms') r = await morningDMs();
    else if (job === 'gc') r = await blobGC();
    else r = await morning();
    return res.status(200).json(r);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
