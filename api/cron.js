import { sql } from '../lib/db.js';
import { sendGroup, sendDM } from '../lib/whatsapp.js';
import { list, del } from '@vercel/blob';

const OPEN = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação'];
const ICON = { 'Agendado': '🗓️', 'Em produção': '🛠️', 'Aguardando aprovação': '👀', 'Modificação': '✏️', 'Finalizado': '✅', 'Postado': '📣' };
function monthLabel(ym) {
  const M = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const p = String(ym).split('-'); return (M[+p[1] - 1] || p[1]) + ' ' + p[0];
}

// Demandas a concluir (atrasadas/hoje) → grupo, agrupadas por RESPONSÁVEL, com ícone de status,
// ordenadas da mais próxima de vencer para a menos próxima.
async function overdue() {
  const p = await sql(`select p.title, to_char(p.due_date,'DD/MM') as due, p.status,
      c.name as client, u.name as resp
    from posts p left join clients c on c.id = p.client_id left join users u on u.id = p.responsible_id
    where p.due_date is not null and p.due_date <= current_date and p.status = any($1)
    order by u.name nulls last, p.due_date asc limit 150`, [OPEN]);
  if (!p.rows.length) return { posts: 0 };
  const byResp = {};
  for (const r of p.rows) { const k = r.resp || 'Sem responsável'; (byResp[k] = byResp[k] || []).push(r); }
  const blocks = ['⏰ *Demandas a concluir (' + p.rows.length + ')*'];
  for (const resp of Object.keys(byResp)) {
    const lines = byResp[resp].map((r) => (ICON[r.status] || '•') + ' *' + r.title + '* — ' + (r.client || 'sem cliente') + ' — vence ' + r.due);
    blocks.push('👤 *' + resp + '*\n' + lines.join('\n'));
  }
  await sendGroup(blocks.join('\n\n'));
  await sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)', [p.rows.length + ' demanda(s) a concluir', 'due', true]);
  return { posts: p.rows.length };
}

// Rotinas vencidas → DM no privado do dono.
async function routineDMs() {
  const r = await sql(`select r.title, to_char(r.due_date,'DD/MM') as due, u.name as owner, u.phone
    from routines r join users u on u.id = r.owner_id
    where r.due_date is not null and r.due_date <= current_date and r.done = false order by u.id`);
  const byPhone = {};
  for (const row of r.rows) { if (!row.phone) continue; (byPhone[row.phone] = byPhone[row.phone] || { name: row.owner, items: [] }).items.push(row); }
  let dms = 0;
  for (const phone of Object.keys(byPhone)) {
    const o = byPhone[phone];
    const msg = '👋 Oi ' + (o.name || '') + '! Suas rotinas vencidas:\n' + o.items.map((i) => '• ' + i.title + ' (até ' + i.due + ')').join('\n');
    try { await sendDM(phone, msg); dms++; } catch (e) { /* segue */ }
  }
  return { routineDMs: dms };
}

// Posts a 2 dias do prazo de conclusão → grupo (1 msg por post).
async function reminder() {
  const p = await sql(`select p.title, to_char(p.due_date,'DD/MM') as due, p.status, c.name as client, u.name as resp
    from posts p left join clients c on c.id = p.client_id left join users u on u.id = p.responsible_id
    where p.due_date = current_date + interval '2 day' and p.status = any($1) order by p.due_date`, [OPEN]);
  let sent = 0;
  for (const r of p.rows) {
    await sendGroup('🟡 *Faltam 2 dias para concluir*\n*' + r.title + '* — ' + (r.client || 'sem cliente') + '\nConcluir até ' + r.due + (r.resp ? ' · Resp: ' + r.resp : '') + ' · _' + r.status + '_');
    sent++;
  }
  if (sent) await sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)', [sent + ' post(s) a 2 dias do prazo', 'due', true]);
  return { reminders: sent };
}

// Posts FINALIZADOS aguardando publicação → lembrete no grupo.
async function finalizedReminder() {
  const p = await sql(`select p.title, c.name as client, u.name as resp, p.pub_time
    from posts p left join clients c on c.id = p.client_id left join users u on u.id = p.responsible_id
    where p.status = 'Finalizado' order by u.name nulls last limit 80`);
  if (!p.rows.length) return { finalized: 0 };
  const lines = p.rows.map((r) => '✅ *' + r.title + '* — ' + (r.client || 'sem cliente') + (r.resp ? ' · ' + r.resp : '') + (r.pub_time ? ' · ' + r.pub_time : ''));
  await sendGroup('📣 *Prontos para publicar (' + p.rows.length + ')*\nFinalizados aguardando publicação:\n\n' + lines.join('\n'));
  await sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)', [p.rows.length + ' finalizado(s) aguardando publicação', 'due', true]);
  return { finalized: p.rows.length };
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

// Recap do dia (18h seg–sex): pendências que ainda não foram publicadas.
async function digest() {
  const p = await sql(`select p.title, to_char(p.due_date,'DD/MM') as due, p.status, c.name as client, u.name as resp
    from posts p left join clients c on c.id = p.client_id left join users u on u.id = p.responsible_id
    where p.status <> 'Postado' and p.pub_date is not null
    order by p.due_date nulls last limit 150`);
  if (!p.rows.length) { await sendGroup('🌙 *Recap do dia* — sem pendências, tudo publicado! 🎉'); return { pending: 0 }; }
  const byStatus = {};
  for (const r of p.rows) (byStatus[r.status] = byStatus[r.status] || []).push(r);
  const order = ['Aguardando aprovação', 'Modificação', 'Em produção', 'Agendado', 'Finalizado'];
  const blocks = ['🌙 *Recap do dia — pendências (' + p.rows.length + ')*'];
  for (const s of order) {
    if (!byStatus[s]) continue;
    const lines = byStatus[s].map((r) => (ICON[s] || '•') + ' *' + r.title + '* — ' + (r.client || 'sem cliente') + (r.resp ? ' · ' + r.resp : '') + (r.due ? ' · vence ' + r.due : ''));
    blocks.push('*' + s + ' (' + byStatus[s].length + ')*\n' + lines.join('\n'));
  }
  await sendGroup(blocks.join('\n\n'));
  await sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)', ['Recap: ' + p.rows.length + ' pendência(s)', 'digest', true]);
  return { pending: p.rows.length };
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
  try { Object.assign(out, await overdue()); } catch (e) { out.overdueErr = String(e.message || e); }
  try { Object.assign(out, await routineDMs()); } catch (e) {}
  try { Object.assign(out, await reminder()); } catch (e) {}
  try { Object.assign(out, await finalizedReminder()); } catch (e) {}
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
    else if (job === 'reminder') r = await reminder();
    else if (job === 'overdue') r = await overdue();
    else if (job === 'finalized') r = await finalizedReminder();
    else if (job === 'gc') r = await blobGC();
    else r = await morning();
    return res.status(200).json(r);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
