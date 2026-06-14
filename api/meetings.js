import { sql, requireAuth } from '../lib/db.js';

function cleanParts(p) {
  if (!Array.isArray(p)) return [];
  return p.filter(function (x) { return typeof x === 'string' && x; }).slice(0, 100);
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        select id, title, to_char(meeting_date,'YYYY-MM-DD') as meeting_date,
               category, participants, notes, created_at, updated_at
        from meetings
        order by meeting_date desc nulls last, created_at desc`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
      const parts = JSON.stringify(cleanParts(b.participants));
      const { rows } = await sql`
        insert into meetings (title, meeting_date, category, participants, notes)
        values (${title}, ${b.meeting_date || null}, ${String(b.category || '')}, ${parts}::jsonb, ${String(b.notes || '')})
        returning id, title, to_char(meeting_date,'YYYY-MM-DD') as meeting_date, category, participants, notes, created_at, updated_at`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const b = req.body || {};
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
      const parts = JSON.stringify(cleanParts(b.participants));
      const { rows } = await sql`
        update meetings set title = ${title}, meeting_date = ${b.meeting_date || null},
          category = ${String(b.category || '')}, participants = ${parts}::jsonb,
          notes = ${String(b.notes || '')}, updated_at = now()
        where id = ${id}
        returning id, title, to_char(meeting_date,'YYYY-MM-DD') as meeting_date, category, participants, notes, created_at, updated_at`;
      if (!rows.length) return res.status(404).json({ error: 'Reunião não encontrada' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      await sql('delete from meetings where id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
