// PÚBLICO (sem login): painel de visualização do cliente, via share_token.
import { sql } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'método não permitido' });
  const t = req.query && req.query.t;
  if (!t) return res.status(400).json({ error: 'token ausente' });
  try {
    const c = await sql('select id, name, cover_url, avatar_url, is_internal from clients where share_token = $1', [t]);
    if (!c.rows.length) return res.status(404).json({ error: 'Painel não encontrado' });
    const client = c.rows[0];
    // só campos seguros; publicações planejadas do mês atual em diante
    const p = await sql(`select to_char(pub_date,'YYYY-MM-DD') as pub_date, pub_time, title, post_type, funnel_stage, status
      from posts
      where client_id = $1 and pub_date is not null and pub_date >= date_trunc('month', current_date)
      order by pub_date, pub_time`, [client.id]);
    return res.status(200).json({
      client: { name: client.name, cover_url: client.cover_url, avatar_url: client.avatar_url, is_internal: client.is_internal },
      posts: p.rows,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
