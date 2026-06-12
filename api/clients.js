import { sql, requireAuth } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    try {
      const { rows } = await sql`select id, name, is_internal from clients order by is_internal desc, name`;
      return res.status(200).json(rows);
    } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
  }

  if (req.method === 'POST') {
    if (!requireAuth(req, res)) return;
    const { name, is_internal } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    try {
      const { rows } = await sql`
        insert into clients (name, is_internal)
        values (${String(name).trim()}, ${!!is_internal})
        returning id, name, is_internal`;
      return res.status(201).json(rows[0]);
    } catch (e) {
      if (String(e.message || '').includes('unique') || String(e.code) === '23505')
        return res.status(409).json({ error: 'Já existe um cliente com esse nome' });
      return res.status(500).json({ error: String(e.message || e) });
    }
  }

  return res.status(405).json({ error: 'método não permitido' });
}
