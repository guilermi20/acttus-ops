import { sql } from '../../lib/db.js';
import { sendGroup, sendDM } from '../../lib/whatsapp.js';

// "Em aberto" = do status Modificação para trás no funil de produção.
const OPEN = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação'];

// 08:00 America/Sao_Paulo (= 11:00 UTC). Posts a concluir → grupo; rotinas vencidas → DM do dono.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = (req.headers['authorization'] || '').replace('Bearer ', '');
  const provided = auth || (req.query && req.query.secret);
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  const out = { posts: 0, routineDMs: 0 };
  try {
    // posts cujo PRAZO DE CONCLUSÃO já chegou (vencidos ou hoje) e ainda em aberto
    const p = await sql(`select p.title, to_char(p.due_date,'DD/MM') as due, p.status,
        c.name as client, u.name as resp
      from posts p
      left join clients c on c.id = p.client_id
      left join users u on u.id = p.responsible_id
      where p.due_date is not null and p.due_date <= current_date and p.status = any($1)
      order by p.due_date asc limit 80`, [OPEN]);
    if (p.rows.length) {
      const lines = p.rows.map((r) => '• *' + r.title + '* — ' + (r.client || 'sem cliente') +
        ' — concluir até ' + r.due + ' — _' + r.status + '_' + (r.resp ? ' (' + r.resp + ')' : ''));
      await sendGroup('⏰ *Acttus OS — tarefas a concluir (vencidas/hoje) — ' + p.rows.length + '*\n\n' + lines.join('\n'));
      out.posts = p.rows.length;
      await sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)',
        [p.rows.length + ' tarefa(s) a concluir avisada(s) no grupo', 'due', true]);
    }

    // rotinas vencidas → DM no privado do dono (agrupadas por telefone)
    const r = await sql(`select r.title, to_char(r.due_date,'DD/MM') as due, u.name as owner, u.phone
      from routines r join users u on u.id = r.owner_id
      where r.due_date is not null and r.due_date <= current_date and r.done = false
      order by u.id`);
    const byPhone = {};
    for (const row of r.rows) { if (!row.phone) continue; (byPhone[row.phone] = byPhone[row.phone] || { name: row.owner, items: [] }).items.push(row); }
    for (const phone of Object.keys(byPhone)) {
      const o = byPhone[phone];
      const msg = '👋 Oi ' + (o.name || '') + '! Suas rotinas vencidas:\n' + o.items.map((i) => '• ' + i.title + ' (até ' + i.due + ')').join('\n');
      try { await sendDM(phone, msg); out.routineDMs++; } catch (e) { /* segue mesmo se uma falhar */ }
    }

    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
