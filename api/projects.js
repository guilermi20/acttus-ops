import { sql, requireAuth } from '../lib/db.js';

const STATUS = ['Ativo', 'Pausado', 'Concluído'];
const SEL = `select p.id, p.name, p.description, p.responsible_id, p.status, p.created_at, p.updated_at,
  u.name as responsible_name,
  (select count(*)::int from project_tasks t where t.project_id = p.id) as task_count,
  (select count(*)::int from project_tasks t where t.project_id = p.id and t.status = 'Concluída') as done_count
  from projects p left join users u on u.id = p.responsible_id`;

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const { rows } = await sql(SEL + ' order by p.created_at desc');
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const name = String(b.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
      const status = STATUS.includes(b.status) ? b.status : 'Ativo';
      const { rows } = await sql`insert into projects (name, description, responsible_id, status)
        values (${name}, ${String(b.description || '')}, ${b.responsible_id || null}, ${status}) returning id`;
      const f = await sql(SEL + ' where p.id = $1', [rows[0].id]);
      return res.status(201).json(f.rows[0]);
    }
    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const b = req.body || {};
      const fld = {};
      if ('name' in b) fld.name = String(b.name || '').trim();
      if ('description' in b) fld.description = String(b.description || '');
      if ('responsible_id' in b) fld.responsible_id = b.responsible_id || null;
      if ('status' in b && STATUS.includes(b.status)) fld.status = b.status;
      const keys = Object.keys(fld);
      if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
      const sets = keys.map((k, i) => k + ' = $' + (i + 1)).join(', ');
      const vals = keys.map((k) => fld[k]); vals.push(id);
      const upd = await sql('update projects set ' + sets + ', updated_at = now() where id = $' + vals.length + ' returning id', vals);
      if (!upd.rows.length) return res.status(404).json({ error: 'Projeto não encontrado' });
      const f = await sql(SEL + ' where p.id = $1', [id]);
      return res.status(200).json(f.rows[0]);
    }
    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      await sql('delete from projects where id = $1', [id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
