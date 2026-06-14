import { sql, requireAuth } from '../lib/db.js';
import crypto from 'node:crypto';

const COLS = 'id, name, is_internal, share_token, cover_url, avatar_url';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const { rows } = await sql('select ' + COLS + ' from clients order by is_internal desc, name');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, is_internal, cover_url, avatar_url } = req.body || {};
      if (!name || !String(name).trim()) return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
      const token = crypto.randomBytes(16).toString('hex');
      const ins = await sql`
        insert into clients (name, is_internal, share_token, cover_url, avatar_url)
        values (${String(name).trim()}, ${!!is_internal}, ${token}, ${cover_url || null}, ${avatar_url || null})
        returning id`;
      const { rows } = await sql('select ' + COLS + ' from clients where id = $1', [ins.rows[0].id]);
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const b = req.body || {};
      const f = {};
      if ('name' in b) f.name = String(b.name || '').trim();
      if ('is_internal' in b) f.is_internal = !!b.is_internal;
      if ('cover_url' in b) f.cover_url = b.cover_url || null;
      if ('avatar_url' in b) f.avatar_url = b.avatar_url || null;
      const keys = Object.keys(f);
      if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
      const sets = keys.map((k, i) => k + ' = $' + (i + 1)).join(', ');
      const vals = keys.map((k) => f[k]); vals.push(id);
      const upd = await sql('update clients set ' + sets + ' where id = $' + vals.length + ' returning id', vals);
      if (!upd.rows.length) return res.status(404).json({ error: 'Cliente não encontrado' });
      const { rows } = await sql('select ' + COLS + ' from clients where id = $1', [id]);
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      await sql('delete from clients where id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    if (String(e.message || '').includes('unique') || String(e.code) === '23505')
      return res.status(409).json({ error: 'Já existe um cliente com esse nome' });
    return res.status(500).json({ error: String(e.message || e) });
  }
}
