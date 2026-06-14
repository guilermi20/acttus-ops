// PÚBLICO (sem login): painel do cliente (GET) e sugerir ideia (POST), via share_token ?t=
import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  const t = (req.query && req.query.t) || (req.body && req.body.t);
  if (!t) return res.status(400).json({ error: 'token ausente' });
  try {
    const c = await sql('select id, name, cover_url, avatar_url, is_internal from clients where share_token = $1', [t]);
    if (!c.rows.length) return res.status(404).json({ error: 'Painel não encontrado' });
    const client = c.rows[0];

    if (req.method === 'GET') {
      const p = await sql(`select to_char(pub_date,'YYYY-MM-DD') as pub_date, pub_time, title, post_type, funnel_stage, status
        from posts
        where client_id = $1 and pub_date is not null and pub_date >= date_trunc('month', current_date)
        order by pub_date, pub_time`, [client.id]);
      return res.status(200).json({
        client: { name: client.name, cover_url: client.cover_url, avatar_url: client.avatar_url, is_internal: client.is_internal },
        posts: p.rows,
      });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Descreva a ideia' });
      await sql`insert into ideas (client_id, title, notes, status, source)
        values (${client.id}, ${title.slice(0, 300)}, ${String(b.notes || '').slice(0, 2000)}, 'nova', 'painel')`;
      await sql('insert into notifications (text, kind) values ($1, $2)', ['Nova ideia sugerida por ' + client.name, 'idea']);
      return res.status(201).json({ ok: true });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
