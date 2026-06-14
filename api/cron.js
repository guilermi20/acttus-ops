import { sql } from '../lib/db.js';
import { sendGroup, sendDM } from '../lib/whatsapp.js';

const OPEN = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação'];

// 08:00 SP: posts a concluir (atrasados/hoje) → grupo; rotinas vencidas → DM do dono.
async function overdue() {
  const out = { posts: 0, late: 0, today: 0, routineDMs: 0 };
  const p = await sql(`select p.title, to_char(p.due_date,'DD/MM') as due, p.status,
      (p.due_date < current_date) as is_late, c.name as client, u.name as resp
    from posts p left join clients c on c.id = p.client_id left join users u on u.id = p.responsible_id
    where p.due_date is not null and p.due_date <= current_date and p.status = any($1)
    order by p.due_date asc limit 80`, [OPEN]);
  if (p.rows.length) {
    const late = p.rows.filter((r) => r.is_late);
    const today = p.rows.filter((r) => !r.is_late);
    const lineLate = (r) => '• *' + r.title + '* — ' + (r.client || 'sem cliente') + ' — venceu ' + r.due + ' — _' + r.status + '_' + (r.resp ? ' · ' + r.resp : '');
    const lineToday = (r) => '• *' + r.title + '* — ' + (r.client || 'sem cliente') + ' — _' + r.status + '_' + (r.resp ? ' · ' + r.resp : '');
    const blocks = ['⏰ *Acttus OS — tarefas a concluir*'];
    if (late.length) blocks.push('🔴 *Atrasados (' + late.length + ')*\n' + late.map(lineLate).join('\n'));
    if (today.length) blocks.push('🟡 *Para hoje (' + today.length + ')*\n' + today.map(lineToday).join('\n'));
    await sendGroup(blocks.join('\n\n'));
    out.posts = p.rows.length; out.late = late.length; out.today = today.length;
    await sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)', [late.length + ' atrasada(s) e ' + today.length + ' para hoje', 'due', true]);
  }
  const r = await sql(`select r.title, to_char(r.due_date,'DD/MM') as due, u.name as owner, u.phone
    from routines r join users u on u.id = r.owner_id
    where r.due_date is not null and r.due_date <= current_date and r.done = false order by u.id`);
  const byPhone = {};
  for (const row of r.rows) { if (!row.phone) continue; (byPhone[row.phone] = byPhone[row.phone] || { name: row.owner, items: [] }).items.push(row); }
  for (const phone of Object.keys(byPhone)) {
    const o = byPhone[phone];
    const msg = '👋 Oi ' + (o.name || '') + '! Suas rotinas vencidas:\n' + o.items.map((i) => '• ' + i.title + ' (até ' + i.due + ')').join('\n');
    try { await sendDM(phone, msg); out.routineDMs++; } catch (e) { /* segue */ }
  }
  return out;
}

// 09:00 SP: posts a 2 dias do prazo de conclusão → grupo (1 msg por post).
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

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const provided = (req.headers['authorization'] || '').replace('Bearer ', '') || (req.query && req.query.secret);
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });
  const job = (req.query && req.query.job) || 'overdue';
  try {
    const r = job === 'reminder' ? await reminder() : await overdue();
    return res.status(200).json(r);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
