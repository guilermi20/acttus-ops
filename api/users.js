import { sql, requireAuth, onlyDigits } from '../lib/db.js';

const ROLES = ['member', 'admin'];

export default async function handler(req, res) {
  const uid = requireAuth(req, res);
  if (!uid) return;

  if (req.method === 'DELETE') {
    const id = req.query && req.query.id;
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    if (id === uid) return res.status(400).json({ error: 'Você não pode excluir o seu próprio usuário' });
    try { await sql('delete from users where id = $1', [id]); return res.status(200).json({ ok: true }); }
    catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
  }

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`select id, name, cpf, email, phone, role from users order by name`;
      return res.status(200).json(rows);
    } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
  }

  if (req.method === 'POST') {
    const { name, cpf, email, phone, role } = req.body || {};
    const cpfN = onlyDigits(cpf);
    const emailN = String(email || '').trim().toLowerCase();
    const phoneN = onlyDigits(phone) || null;
    const roleN = ROLES.includes(role) ? role : 'member';
    if (!name || !cpfN || !emailN) return res.status(400).json({ error: 'Nome, CPF e email são obrigatórios' });
    if (cpfN.length !== 11) return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
    try {
      const { rows } = await sql`
        insert into users (name, cpf, email, phone, role)
        values (${name}, ${cpfN}, ${emailN}, ${phoneN}, ${roleN})
        returning id, name, cpf, email, phone, role`;
      return res.status(201).json(rows[0]);
    } catch (e) {
      if (String(e.message || '').includes('unique') || String(e.code) === '23505')
        return res.status(409).json({ error: 'Já existe um usuário com esse CPF' });
      return res.status(500).json({ error: String(e.message || e) });
    }
  }

  if (req.method === 'PATCH') {
    const id = (req.query && req.query.id) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    const { name, cpf, email, phone, role } = req.body || {};
    const cpfN = onlyDigits(cpf);
    const emailN = String(email || '').trim().toLowerCase();
    const phoneN = onlyDigits(phone) || null;
    const roleN = ROLES.includes(role) ? role : 'member';
    if (!name || !cpfN || !emailN) return res.status(400).json({ error: 'Nome, CPF e email são obrigatórios' });
    if (cpfN.length !== 11) return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
    try {
      const { rows } = await sql`
        update users set name = ${name}, cpf = ${cpfN}, email = ${emailN}, phone = ${phoneN}, role = ${roleN}
        where id = ${id}
        returning id, name, cpf, email, phone, role`;
      if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
      return res.status(200).json(rows[0]);
    } catch (e) {
      if (String(e.message || '').includes('unique') || String(e.code) === '23505')
        return res.status(409).json({ error: 'Já existe um usuário com esse CPF' });
      return res.status(500).json({ error: String(e.message || e) });
    }
  }

  return res.status(405).json({ error: 'método não permitido' });
}
