// PÚBLICO (sem login): cliente sugere uma ideia pelo painel; fica rastreada por cliente.
import { sql } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método não permitido' });
  const t = (req.query && req.query.t) || (req.body && req.body.t);
  const b = req.body || {};
  const title = String(b.title || '').trim();
  if (!t) return res.status(400).json({ error: 'token ausente' });
  if (!title) return res.status(400).json({ error: 'Descreva a ideia' });
  try {
    const c = await sql('select id, name from clients where share_token = $1', [t]);
    if (!c.rows.length) return res.status(404).json({ error: 'Painel não encontrado' });
    const client = c.rows[0];
    await sql`insert into ideas (client_id, title, notes, status, source)
      values (${client.id}, ${title.slice(0, 300)}, ${String(b.notes || '').slice(0, 2000)}, 'nova', 'painel')`;
    await sql('insert into notifications (text, kind) values ($1, $2)', ['Nova ideia sugerida por ' + client.name, 'idea']);
    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
