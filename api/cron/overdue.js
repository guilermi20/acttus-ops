import { sql } from '../../lib/db.js';
import { sendText } from '../../lib/whatsapp.js';

function fmtDate(d) {
  const x = new Date(d);
  return String(x.getUTCDate()).padStart(2, '0') + '/' + String(x.getUTCMonth() + 1).padStart(2, '0');
}

// Chamado pelo Vercel Cron (1x/dia). Também aceita ?secret= para teste manual.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = (req.headers['authorization'] || '').replace('Bearer ', '');
  const provided = auth || (req.query && req.query.secret);
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  try {
    const { rows } = await sql`
      select p.title, p.pub_date, p.pub_time, p.status,
             c.name as client_name, u.name as resp
      from posts p
      left join clients c on c.id = p.client_id
      left join users u on u.id = p.responsible_id
      where p.pub_date is not null
        and p.pub_date < current_date
        and p.status <> 'Postado'
      order by p.pub_date asc
      limit 50`;

    if (!rows.length) {
      return res.status(200).json({ overdue: 0, sent: false, message: 'Sem tarefas vencidas' });
    }

    const lines = rows.map((r) =>
      '• *' + r.title + '* — ' + (r.client_name || 'sem cliente') +
      ' — venceu ' + fmtDate(r.pub_date) +
      ' — _' + r.status + '_' + (r.resp ? ' (' + r.resp + ')' : ''));
    const msg = '🟡 *Acttus OS — Tarefas vencidas (' + rows.length + ')*\n\n' + lines.join('\n');

    await sendText(msg);
    await sql`insert into notifications (text, kind, whatsapp_sent)
              values (${'WhatsApp: ' + rows.length + ' tarefa(s) vencida(s) enviada(s) ao grupo'}, 'due', true)`;

    return res.status(200).json({ overdue: rows.length, sent: true });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
