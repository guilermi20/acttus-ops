import { sql, requireAuth } from '../lib/db.js';

const SEL = `select r.id, r.owner_id, r.title, r.notes, to_char(r.due_date,'YYYY-MM-DD') as due_date,
  r.done, r.created_at, r.updated_at, u.name as owner_name
  from routines r left join users u on u.id = r.owner_id`;

export default async function handler(req, res) {
  const uid = requireAuth(req, res);
  if (!uid) return;
  try {
    if (req.method === 'GET') {
      const wantAll = req.query && req.query.scope === 'all';
      let isAdmin = false;
      if (wantAll) { const a = await sql('select role from users where id = $1', [uid]); isAdmin = a.rows[0] && a.rows[0].role === 'admin'; }
      const q = (wantAll && isAdmin)
        ? await sql(SEL + ' order by r.done, r.due_date nulls last, r.created_at desc')
        : await sql(SEL + ' where r.owner_id = $1 order by r.done, r.due_date nulls last, r.created_at desc', [uid]);
      return res.status(200).json(q.rows);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
      const { rows } = await sql`insert into routines (owner_id, title, notes, due_date, done)
        values (${uid}, ${title}, ${String(b.notes || '')}, ${b.due_date || null}, ${!!b.done}) returning id`;
      const full = await sql(SEL + ' where r.id = $1', [rows[0].id]);
      return res.status(201).json(full.rows[0]);
    }

    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const own = await sql('select owner_id from routines where id = $1', [id]);
      if (!own.rows.length) return res.status(404).json({ error: 'Rotina não encontrada' });
      if (own.rows[0].owner_id !== uid) return res.status(403).json({ error: 'Sem permissão' });
      const b = req.body || {};
      const f = {};
      if ('title' in b) f.title = String(b.title || '').trim();
      if ('notes' in b) f.notes = String(b.notes || '');
      if ('due_date' in b) f.due_date = b.due_date || null;
      if ('done' in b) f.done = !!b.done;
      const keys = Object.keys(f);
      if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
      const sets = keys.map((k, i) => k + ' = $' + (i + 1)).join(', ');
      const vals = keys.map((k) => f[k]); vals.push(id);
      await sql('update routines set ' + sets + ', updated_at = now() where id = $' + vals.length, vals);
      const full = await sql(SEL + ' where r.id = $1', [id]);
      return res.status(200).json(full.rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const own = await sql('select owner_id from routines where id = $1', [id]);
      if (own.rows.length && own.rows[0].owner_id !== uid) return res.status(403).json({ error: 'Sem permissão' });
      await sql('delete from routines where id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
