import { sql, makeToken, onlyDigits } from '../lib/db.js';
import { sectorsOf } from '../lib/sectors.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método não permitido' });
  const { cpf, email } = req.body || {};
  const cpfN = onlyDigits(cpf);
  const emailN = String(email || '').trim().toLowerCase();
  if (!cpfN || !emailN) return res.status(400).json({ error: 'CPF e email são obrigatórios' });
  try {
    const { rows } = await sql`
      select id, name, email, role, sectors from users
      where cpf = ${cpfN} and lower(email) = ${emailN}
      limit 1`;
    if (!rows.length) return res.status(401).json({ error: 'Usuário não encontrado. Confira CPF e email.' });
    const u = rows[0];
    return res.status(200).json({
      user: { id: u.id, name: u.name, email: u.email, role: u.role || 'member', sectors: sectorsOf(u) },
      token: makeToken(u.id),
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
