import { sql, requireAuth } from '../lib/db.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        select id, text, kind, link_post_id,
               to_char(created_at,'DD/MM') as date, read_at
        from notifications
        order by created_at desc
        limit 50`;
      return res.status(200).json(rows);
    }
    if (req.method === 'PATCH') {
      await sql`update notifications set read_at = now() where read_at is null`;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
