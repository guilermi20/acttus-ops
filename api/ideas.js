import { sql, requireAuthUser } from '../lib/db.js';
import { sectorsOf, validSector } from '../lib/sectors.js';

const SEL = `select i.id, i.client_id, i.title, i.notes, i.status, i.source, i.sector, i.created_at,
  c.name as client_name, c.is_internal
  from ideas i left join clients c on c.id = i.client_id`;

export default async function handler(req, res) {
  const me = await requireAuthUser(req, res);
  if (!me) return;
  const mine = sectorsOf(me); // ideias pertencem ao setor em que foram criadas
  try {
    if (req.method === 'GET') {
      const { rows } = await sql(SEL + ' where i.sector = any($1::text[]) order by i.created_at desc', [mine]);
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Título é obrigatório' });
      const sector = validSector(b.sector) || mine[0];
      if (!mine.includes(sector)) return res.status(403).json({ error: 'Você não tem acesso ao setor "' + sector + '"' });
      const ins = await sql`insert into ideas (client_id, title, notes, status, source, sector)
        values (${b.client_id || null}, ${title}, ${String(b.notes || '')}, 'nova', 'interno', ${sector}) returning id`;
      const f = await sql(SEL + ' where i.id = $1', [ins.rows[0].id]);
      return res.status(201).json(f.rows[0]);
    }
    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const b = req.body || {};
      const f = {};
      if ('status' in b) f.status = String(b.status || '');
      if ('title' in b) f.title = String(b.title || '').trim();
      if ('notes' in b) f.notes = String(b.notes || '');
      if ('client_id' in b) f.client_id = b.client_id || null;
      const keys = Object.keys(f);
      if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
      const sets = keys.map((k, i) => k + ' = $' + (i + 1)).join(', ');
      const vals = keys.map((k) => f[k]); vals.push(id);
      const idPos = vals.length; vals.push(mine);
      const upd = await sql('update ideas set ' + sets + ' where id = $' + idPos + ' and sector = any($' + vals.length + '::text[]) returning id', vals);
      if (!upd.rows.length) return res.status(404).json({ error: 'Ideia não encontrada' });
      const ff = await sql(SEL + ' where i.id = $1', [id]);
      return res.status(200).json(ff.rows[0]);
    }
    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const dl = await sql('delete from ideas where id = $1 and sector = any($2::text[]) returning id', [id, mine]);
      if (!dl.rows.length) return res.status(404).json({ error: 'Ideia não encontrada' });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
