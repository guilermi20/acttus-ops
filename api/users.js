import { sql, requireAuth, onlyDigits } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    try {
      const { rows } = await sql`select id, name, email from users order by name`;
      return res.status(200).json(rows);
    } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
  }

  if (req.method === 'POST') {
    if (!requireAuth(req, res)) return;
    const { name, cpf, email } = req.body || {};
    const cpfN = onlyDigits(cpf);
    const emailN = String(email || '').trim().toLowerCase();
    if (!name || !cpfN || !emailN) return res.status(400).json({ error: 'Nome, CPF e email são obrigatórios' });
    if (cpfN.length !== 11) return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
    try {
      const { rows } = await sql`
        insert into users (name, cpf, email)
        values (${name}, ${cpfN}, ${emailN})
        returning id, name, email`;
      return res.status(201).json(rows[0]);
    } catch (e) {
      if (String(e.message || '').includes('unique') || String(e.code) === '23505')
        return res.status(409).json({ error: 'Já existe um usuário com esse CPF' });
      return res.status(500).json({ error: String(e.message || e) });
    }
  }

  return res.status(405).json({ error: 'método não permitido' });
}
