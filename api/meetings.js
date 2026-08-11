import { sql, requireAuthUser } from '../lib/db.js';
import { sectorsOf, validSector } from '../lib/sectors.js';
import { del } from '@vercel/blob';

function cleanParts(p) {
  if (!Array.isArray(p)) return [];
  return p.filter(function (x) { return typeof x === 'string' && x; }).slice(0, 100);
}
function cleanAtts(a) {
  if (!Array.isArray(a)) return [];
  return a.filter(function (x) { return x && typeof x.url === 'string'; })
    .map(function (x) { return { url: x.url, name: String(x.name || ''), type: String(x.type || '') }; }).slice(0, 30);
}
const RET = `id, title, to_char(meeting_date,'YYYY-MM-DD') as meeting_date, category, participants, notes, attachments, sector, created_at, updated_at`;

export default async function handler(req, res) {
  const me = await requireAuthUser(req, res);
  if (!me) return;
  const mine = sectorsOf(me); // reuniões são do setor que as registrou
  try {
    if (req.method === 'GET') {
      const { rows } = await sql('select ' + RET + ' from meetings where sector = any($1::text[]) order by meeting_date desc nulls last, created_at desc', [mine]);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
      const parts = JSON.stringify(cleanParts(b.participants));
      const atts = JSON.stringify(cleanAtts(b.attachments));
      const sector = validSector(b.sector) || mine[0];
      if (!mine.includes(sector)) return res.status(403).json({ error: 'Você não tem acesso ao setor "' + sector + '"' });
      const { rows } = await sql`
        insert into meetings (title, meeting_date, category, participants, notes, attachments, sector)
        values (${title}, ${b.meeting_date || null}, ${String(b.category || '')}, ${parts}::jsonb, ${String(b.notes || '')}, ${atts}::jsonb, ${sector})
        returning id`;
      const f = await sql('select ' + RET + ' from meetings where id = $1', [rows[0].id]);
      return res.status(201).json(f.rows[0]);
    }

    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const b = req.body || {};
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
      const parts = JSON.stringify(cleanParts(b.participants));
      const atts = JSON.stringify(cleanAtts(b.attachments));
      const upd = await sql`
        update meetings set title = ${title}, meeting_date = ${b.meeting_date || null},
          category = ${String(b.category || '')}, participants = ${parts}::jsonb,
          notes = ${String(b.notes || '')}, attachments = ${atts}::jsonb, updated_at = now()
        where id = ${id} and sector = any(${mine}::text[]) returning id`;
      if (!upd.rows.length) return res.status(404).json({ error: 'Reunião não encontrada' });
      const f = await sql('select ' + RET + ' from meetings where id = $1', [id]);
      return res.status(200).json(f.rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      try { const m = await sql('select attachments from meetings where id = $1', [id]); for (const a of ((m.rows[0] && m.rows[0].attachments) || [])) { if (a && a.url) { try { await del(a.url); } catch (e) {} } } } catch (e) {}
      const dl = await sql('delete from meetings where id = $1 and sector = any($2::text[]) returning id', [id, mine]);
      if (!dl.rows.length) return res.status(404).json({ error: 'Reunião não encontrada' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
