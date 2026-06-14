import { sql } from '../../lib/db.js';
import { sendGroup } from '../../lib/whatsapp.js';

const OPEN = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação'];

// 09:00 America/Sao_Paulo (= 12:00 UTC). Avisa o grupo dos posts a 2 dias do PRAZO DE CONCLUSÃO.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = (req.headers['authorization'] || '').replace('Bearer ', '');
  const provided = auth || (req.query && req.query.secret);
  if (secret && provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  try {
    const p = await sql(`select p.title, to_char(p.due_date,'DD/MM') as due, p.status,
        c.name as client, u.name as resp
      from posts p
      left join clients c on c.id = p.client_id
      left join users u on u.id = p.responsible_id
      where p.due_date = current_date + interval '2 day' and p.status = any($1)
      order by p.due_date`, [OPEN]);
    let sent = 0;
    for (const r of p.rows) {
      await sendGroup('🟡 *Faltam 2 dias para concluir*\n*' + r.title + '* — ' + (r.client || 'sem cliente') +
        '\nConcluir até ' + r.due + (r.resp ? ' · Resp: ' + r.resp : '') + ' · _' + r.status + '_');
      sent++;
    }
    if (sent) await sql('insert into notifications (text, kind, whatsapp_sent) values ($1,$2,$3)',
      [sent + ' post(s) a 2 dias do prazo avisado(s) no grupo', 'due', true]);
    return res.status(200).json({ reminders: sent });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
