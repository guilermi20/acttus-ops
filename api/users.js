import { sql, requireAuth, onlyDigits } from '../lib/db.js';
import { cleanSectors } from '../lib/sectors.js';

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
      const { rows } = await sql`select id, name, cpf, email, phone, role, sectors from users order by name`;
      return res.status(200).json(rows);
    } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
  }

  if (req.method === 'POST') {
    const { name, cpf, email, phone, role, sectors } = req.body || {};
    const cpfN = onlyDigits(cpf);
    const emailN = String(email || '').trim().toLowerCase();
    const phoneN = onlyDigits(phone) || null;
    const roleN = ROLES.includes(role) ? role : 'member';
    const secN = JSON.stringify(cleanSectors(sectors));
    if (!name || !cpfN || !emailN) return res.status(400).json({ error: 'Nome, CPF e email são obrigatórios' });
    if (cpfN.length !== 11) return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
    try {
      const { rows } = await sql`
        insert into users (name, cpf, email, phone, role, sectors)
        values (${name}, ${cpfN}, ${emailN}, ${phoneN}, ${roleN}, ${secN}::jsonb)
        returning id, name, cpf, email, phone, role, sectors`;
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
    const { name, cpf, email, phone, role, sectors } = req.body || {};
    const cpfN = onlyDigits(cpf);
    const emailN = String(email || '').trim().toLowerCase();
    const phoneN = onlyDigits(phone) || null;
    const roleN = ROLES.includes(role) ? role : 'member';
    // Quem vincula setor é o admin (o campo só aparece para ele na tela).
    // "sectors" ausente — ou vindo de um não-admin — mantém o que já está lá,
    // em vez de zerar o acesso de alguém.
    const me = await sql('select role from users where id = $1', [uid]);
    const iAmAdmin = !!(me.rows[0] && me.rows[0].role === 'admin');
    const secN = (iAmAdmin && 'sectors' in (req.body || {})) ? JSON.stringify(cleanSectors(sectors)) : null;
    if (!name || !cpfN || !emailN) return res.status(400).json({ error: 'Nome, CPF e email são obrigatórios' });
    if (cpfN.length !== 11) return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
    try {
      const { rows } = await sql`
        update users set name = ${name}, cpf = ${cpfN}, email = ${emailN}, phone = ${phoneN}, role = ${roleN},
          sectors = coalesce(${secN}::jsonb, sectors)
        where id = ${id}
        returning id, name, cpf, email, phone, role, sectors`;
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
