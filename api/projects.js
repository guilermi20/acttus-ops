// Projetos internos (+ tarefas, entity=task) e campanhas de tráfego
// (entity=campaign). As três entidades moram no mesmo arquivo porque o plano
// Hobby da Vercel limita o projeto a 12 funções serverless — e já estamos nas 12.
import { sql, requireAuthUser } from '../lib/db.js';
import { sectorsOf, validSector } from '../lib/sectors.js';
import { del } from '@vercel/blob';

const P_STATUS = ['Ativo', 'Pausado', 'Concluído'];
const T_STATUS = ['A fazer', 'Em andamento', 'Concluída'];
const C_STATUS = ['Planejamento', 'Ativa', 'Pausada', 'Encerrada'];
const C_PLATFORM = ['meta', 'google', 'tiktok', 'linkedin', 'outro'];
function cleanAtts(a) {
  if (!Array.isArray(a)) return [];
  return a.filter(function (x) { return x && typeof x.url === 'string'; })
    .map(function (x) { return { url: x.url, name: String(x.name || ''), type: String(x.type || '') }; }).slice(0, 30);
}

const PSEL = `select p.id, p.name, p.description, p.responsible_id, p.status, p.attachments, p.sector, p.created_at, p.updated_at,
  u.name as responsible_name,
  (select count(*)::int from project_tasks t where t.project_id = p.id) as task_count,
  (select count(*)::int from project_tasks t where t.project_id = p.id and t.status = 'Concluída') as done_count
  from projects p left join users u on u.id = p.responsible_id`;
const TSEL = `select t.id, t.project_id, t.title, t.responsible_id, to_char(t.due_date,'YYYY-MM-DD') as due_date,
  t.status, t.notes, t.created_at, t.updated_at, u.name as responsible_name
  from project_tasks t left join users u on u.id = t.responsible_id`;
const CSEL = `select c.id, c.client_id, c.name, c.platform, c.objective, c.status, c.budget,
  to_char(c.start_date,'YYYY-MM-DD') as start_date, to_char(c.end_date,'YYYY-MM-DD') as end_date,
  c.responsible_id, c.notes, c.attachments, c.sector, c.created_at, c.updated_at,
  cl.name as client_name, u.name as responsible_name
  from campaigns c left join clients cl on cl.id = c.client_id left join users u on u.id = c.responsible_id`;

// --- tarefas de projeto (entity=task) ---
// Tarefa não tem setor próprio: herda o do projeto, então o filtro é no join.
const TASK_IN_SECTOR = ' t.project_id in (select id from projects where sector = any($SEC::text[]))';
async function tasks(req, res, mine) {
  if (req.method === 'GET') {
    const pid = req.query && req.query.project_id;
    const where = ' where' + TASK_IN_SECTOR.replace('$SEC', '$1');
    const q = pid
      ? await sql(TSEL + where + ' and t.project_id = $2 order by t.created_at', [mine, pid])
      : await sql(TSEL + where + ' order by t.created_at', [mine]);
    return res.status(200).json(q.rows);
  }
  if (req.method === 'POST') {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
    if (!b.project_id) return res.status(400).json({ error: 'project_id é obrigatório' });
    const own = await sql('select id from projects where id = $1 and sector = any($2::text[])', [b.project_id, mine]);
    if (!own.rows.length) return res.status(404).json({ error: 'Projeto não encontrado' });
    const status = T_STATUS.includes(b.status) ? b.status : 'A fazer';
    const ins = await sql`insert into project_tasks (project_id, title, responsible_id, due_date, status, notes)
      values (${b.project_id}, ${title}, ${b.responsible_id || null}, ${b.due_date || null}, ${status}, ${String(b.notes || '')}) returning id`;
    const f = await sql(TSEL + ' where t.id = $1', [ins.rows[0].id]);
    return res.status(201).json(f.rows[0]);
  }
  if (req.method === 'PATCH') {
    const id = (req.query && req.query.id) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    const b = req.body || {}, f = {};
    if ('title' in b) f.title = String(b.title || '').trim();
    if ('responsible_id' in b) f.responsible_id = b.responsible_id || null;
    if ('due_date' in b) f.due_date = b.due_date || null;
    if ('status' in b && T_STATUS.includes(b.status)) f.status = b.status;
    if ('notes' in b) f.notes = String(b.notes || '');
    const keys = Object.keys(f);
    if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
    const sets = keys.map((k, i) => k + ' = $' + (i + 1)).join(', ');
    const vals = keys.map((k) => f[k]); vals.push(id);
    const idPos = vals.length; vals.push(mine);
    const upd = await sql('update project_tasks t set ' + sets + ', updated_at = now() where t.id = $' + idPos +
      ' and' + TASK_IN_SECTOR.replace('$SEC', '$' + vals.length) + ' returning t.id', vals);
    if (!upd.rows.length) return res.status(404).json({ error: 'Tarefa não encontrada' });
    const f2 = await sql(TSEL + ' where t.id = $1', [id]);
    return res.status(200).json(f2.rows[0]);
  }
  if (req.method === 'DELETE') {
    const id = req.query && req.query.id;
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    const dl = await sql('delete from project_tasks t where t.id = $1 and' + TASK_IN_SECTOR.replace('$SEC', '$2') + ' returning t.id', [id, mine]);
    if (!dl.rows.length) return res.status(404).json({ error: 'Tarefa não encontrada' });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'método não permitido' });
}

// --- campanhas de tráfego (entity=campaign) ---
async function campaigns(req, res, mine) {
  if (req.method === 'GET') {
    const cid = req.query && req.query.client_id;
    const q = cid
      ? await sql(CSEL + ' where c.sector = any($1::text[]) and c.client_id = $2 order by c.created_at desc', [mine, cid])
      : await sql(CSEL + ' where c.sector = any($1::text[]) order by c.created_at desc', [mine]);
    return res.status(200).json(q.rows);
  }
  if (req.method === 'POST') {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Nome da campanha é obrigatório' });
    const sector = validSector(b.sector) || 'trafego';
    if (!mine.includes(sector)) return res.status(403).json({ error: 'Você não tem acesso ao setor "' + sector + '"' });
    const status = C_STATUS.includes(b.status) ? b.status : 'Planejamento';
    const platform = C_PLATFORM.includes(b.platform) ? b.platform : 'meta';
    const budget = b.budget === '' || b.budget == null ? null : Number(b.budget);
    if (budget != null && !Number.isFinite(budget)) return res.status(400).json({ error: 'Verba inválida' });
    const ins = await sql`insert into campaigns
      (client_id, name, platform, objective, status, budget, start_date, end_date, responsible_id, notes, attachments, sector)
      values (${b.client_id || null}, ${name}, ${platform}, ${String(b.objective || '')}, ${status}, ${budget},
              ${b.start_date || null}, ${b.end_date || null}, ${b.responsible_id || null}, ${String(b.notes || '')},
              ${JSON.stringify(cleanAtts(b.attachments))}::jsonb, ${sector}) returning id`;
    const f = await sql(CSEL + ' where c.id = $1', [ins.rows[0].id]);
    return res.status(201).json(f.rows[0]);
  }
  if (req.method === 'PATCH') {
    const id = (req.query && req.query.id) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    const b = req.body || {}, fld = {};
    if ('client_id' in b) fld.client_id = b.client_id || null;
    if ('name' in b) fld.name = String(b.name || '').trim();
    if ('platform' in b && C_PLATFORM.includes(b.platform)) fld.platform = b.platform;
    if ('objective' in b) fld.objective = String(b.objective || '');
    if ('status' in b && C_STATUS.includes(b.status)) fld.status = b.status;
    if ('budget' in b) {
      const n = b.budget === '' || b.budget == null ? null : Number(b.budget);
      if (n != null && !Number.isFinite(n)) return res.status(400).json({ error: 'Verba inválida' });
      fld.budget = n;
    }
    if ('start_date' in b) fld.start_date = b.start_date || null;
    if ('end_date' in b) fld.end_date = b.end_date || null;
    if ('responsible_id' in b) fld.responsible_id = b.responsible_id || null;
    if ('notes' in b) fld.notes = String(b.notes || '');
    if ('attachments' in b) fld.attachments = cleanAtts(b.attachments);
    const keys = Object.keys(fld);
    if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
    const sets = keys.map((k, i) => (k === 'attachments' ? k + ' = $' + (i + 1) + '::jsonb' : k + ' = $' + (i + 1))).join(', ');
    const vals = keys.map((k) => (k === 'attachments' ? JSON.stringify(fld[k] || []) : fld[k])); vals.push(id);
    const idPos = vals.length; vals.push(mine);
    const upd = await sql('update campaigns set ' + sets + ', updated_at = now() where id = $' + idPos +
      ' and sector = any($' + vals.length + '::text[]) returning id', vals);
    if (!upd.rows.length) return res.status(404).json({ error: 'Campanha não encontrada' });
    const f = await sql(CSEL + ' where c.id = $1', [id]);
    return res.status(200).json(f.rows[0]);
  }
  if (req.method === 'DELETE') {
    const id = req.query && req.query.id;
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    try { const m = await sql('select attachments from campaigns where id = $1', [id]); for (const a of ((m.rows[0] && m.rows[0].attachments) || [])) { if (a && a.url) { try { await del(a.url); } catch (e) {} } } } catch (e) {}
    const dl = await sql('delete from campaigns where id = $1 and sector = any($2::text[]) returning id', [id, mine]);
    if (!dl.rows.length) return res.status(404).json({ error: 'Campanha não encontrada' });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'método não permitido' });
}

export default async function handler(req, res) {
  const me = await requireAuthUser(req, res);
  if (!me) return;
  const mine = sectorsOf(me);
  try {
    if (req.query && req.query.entity === 'task') return await tasks(req, res, mine);
    if (req.query && req.query.entity === 'campaign') return await campaigns(req, res, mine);

    if (req.method === 'GET') {
      const { rows } = await sql(PSEL + ' where p.sector = any($1::text[]) order by p.created_at desc', [mine]);
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const name = String(b.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
      const sector = validSector(b.sector) || mine[0];
      if (!mine.includes(sector)) return res.status(403).json({ error: 'Você não tem acesso ao setor "' + sector + '"' });
      const status = P_STATUS.includes(b.status) ? b.status : 'Ativo';
      const ins = await sql`insert into projects (name, description, responsible_id, status, attachments, sector)
        values (${name}, ${String(b.description || '')}, ${b.responsible_id || null}, ${status}, ${JSON.stringify(cleanAtts(b.attachments))}::jsonb, ${sector}) returning id`;
      const f = await sql(PSEL + ' where p.id = $1', [ins.rows[0].id]);
      return res.status(201).json(f.rows[0]);
    }
    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const b = req.body || {}, fld = {};
      if ('name' in b) fld.name = String(b.name || '').trim();
      if ('description' in b) fld.description = String(b.description || '');
      if ('responsible_id' in b) fld.responsible_id = b.responsible_id || null;
      if ('status' in b && P_STATUS.includes(b.status)) fld.status = b.status;
      if ('attachments' in b) fld.attachments = cleanAtts(b.attachments);
      const keys = Object.keys(fld);
      if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
      const sets = keys.map((k, i) => (k === 'attachments' ? k + ' = $' + (i + 1) + '::jsonb' : k + ' = $' + (i + 1))).join(', ');
      const vals = keys.map((k) => (k === 'attachments' ? JSON.stringify(fld[k] || []) : fld[k])); vals.push(id);
      const idPos = vals.length; vals.push(mine);
      const upd = await sql('update projects set ' + sets + ', updated_at = now() where id = $' + idPos +
        ' and sector = any($' + vals.length + '::text[]) returning id', vals);
      if (!upd.rows.length) return res.status(404).json({ error: 'Projeto não encontrado' });
      const f = await sql(PSEL + ' where p.id = $1', [id]);
      return res.status(200).json(f.rows[0]);
    }
    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      try { const m = await sql('select attachments from projects where id = $1', [id]); for (const a of ((m.rows[0] && m.rows[0].attachments) || [])) { if (a && a.url) { try { await del(a.url); } catch (e) {} } } } catch (e) {}
      const dl = await sql('delete from projects where id = $1 and sector = any($2::text[]) returning id', [id, mine]);
      if (!dl.rows.length) return res.status(404).json({ error: 'Projeto não encontrado' });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
