import { sql, requireAuth } from '../lib/db.js';

const STATUS = ['A fazer', 'Em andamento', 'Concluída'];
const SEL = `select t.id, t.project_id, t.title, t.responsible_id, to_char(t.due_date,'YYYY-MM-DD') as due_date,
  t.status, t.notes, t.created_at, t.updated_at, u.name as responsible_name
  from project_tasks t left join users u on u.id = t.responsible_id`;

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const pid = req.query && req.query.project_id;
      const q = pid ? await sql(SEL + ' where t.project_id = $1 order by t.created_at', [pid])
                    : await sql(SEL + ' order by t.created_at');
      return res.status(200).json(q.rows);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
      if (!b.project_id) return res.status(400).json({ error: 'project_id é obrigatório' });
      const status = STATUS.includes(b.status) ? b.status : 'A fazer';
      const { rows } = await sql`insert into project_tasks (project_id, title, responsible_id, due_date, status, notes)
        values (${b.project_id}, ${title}, ${b.responsible_id || null}, ${b.due_date || null}, ${status}, ${String(b.notes || '')}) returning id`;
      const f = await sql(SEL + ' where t.id = $1', [rows[0].id]);
      return res.status(201).json(f.rows[0]);
    }
    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const b = req.body || {};
      const fld = {};
      if ('title' in b) fld.title = String(b.title || '').trim();
      if ('responsible_id' in b) fld.responsible_id = b.responsible_id || null;
      if ('due_date' in b) fld.due_date = b.due_date || null;
      if ('status' in b && STATUS.includes(b.status)) fld.status = b.status;
      if ('notes' in b) fld.notes = String(b.notes || '');
      const keys = Object.keys(fld);
      if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
      const sets = keys.map((k, i) => k + ' = $' + (i + 1)).join(', ');
      const vals = keys.map((k) => fld[k]); vals.push(id);
      const upd = await sql('update project_tasks set ' + sets + ', updated_at = now() where id = $' + vals.length + ' returning id', vals);
      if (!upd.rows.length) return res.status(404).json({ error: 'Tarefa não encontrada' });
      const f = await sql(SEL + ' where t.id = $1', [id]);
      return res.status(200).json(f.rows[0]);
    }
    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      await sql('delete from project_tasks where id = $1', [id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
