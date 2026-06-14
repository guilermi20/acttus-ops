import { sql, requireAuth } from '../lib/db.js';
import { sendText } from '../lib/whatsapp.js';

const FUNNEL = ['topo', 'meio', 'fundo'];
const TYPES = ['carrossel', 'reels', 'estatico'];
const CHAN = ['organico', 'trafego'];
const TIMES = ['12:00', '18:00'];
const STATUS = ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação', 'Finalizado', 'Postado'];

// Só deixa passar campos conhecidos (whitelist) — protege o UPDATE dinâmico.
function clean(body) {
  const o = {};
  if ('client_id' in body) o.client_id = body.client_id || null;
  if ('title' in body) o.title = String(body.title || '').slice(0, 300);
  if ('funnel_stage' in body && FUNNEL.includes(body.funnel_stage)) o.funnel_stage = body.funnel_stage;
  if ('post_type' in body && TYPES.includes(body.post_type)) o.post_type = body.post_type;
  if ('channel' in body && CHAN.includes(body.channel)) o.channel = body.channel;
  if ('status' in body && STATUS.includes(body.status)) o.status = body.status;
  if ('notes' in body) o.notes = String(body.notes || '');
  if ('pub_date' in body) o.pub_date = body.pub_date || null;
  if ('due_date' in body) o.due_date = body.due_date || null;
  if ('pub_time' in body) o.pub_time = TIMES.includes(body.pub_time) ? body.pub_time : null;
  if ('responsible_id' in body) o.responsible_id = body.responsible_id || null;
  if ('reject_reason' in body) o.reject_reason = body.reject_reason || null;
  return o;
}

const SELECT = `
  select p.id, p.client_id, p.title, p.funnel_stage, p.post_type, p.channel, p.status,
         p.notes, to_char(p.pub_date,'YYYY-MM-DD') as pub_date, to_char(p.due_date,'YYYY-MM-DD') as due_date, p.pub_time,
         p.responsible_id, p.reject_reason, p.created_at, p.updated_at,
         c.name as client_name, c.is_internal, u.name as responsible_name
  from posts p
  left join clients c on c.id = p.client_id
  left join users u on u.id = p.responsible_id`;

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === 'GET') {
      const { rows } = await sql(SELECT + ' order by p.pub_date nulls last, p.pub_time nulls last, p.created_at');
      const { rows: nowRows } = await sql`select now() as now`;
      return res.status(200).json({ posts: rows, now: nowRows[0].now });
    }

    if (req.method === 'POST') {
      const o = clean(req.body || {});
      if (!o.title) return res.status(400).json({ error: 'Título é obrigatório' });
      o.funnel_stage = o.funnel_stage || 'topo';
      o.post_type = o.post_type || 'estatico';
      o.channel = o.channel || 'organico';
      o.status = o.status || 'Agendado';
      const { rows } = await sql`
        insert into posts (client_id, title, funnel_stage, post_type, channel, status, notes, pub_date, due_date, pub_time, responsible_id)
        values (${o.client_id}, ${o.title}, ${o.funnel_stage}, ${o.post_type}, ${o.channel}, ${o.status}, ${o.notes || ''}, ${o.pub_date}, ${o.due_date}, ${o.pub_time}, ${o.responsible_id})
        returning id`;
      const { rows: full } = await sql(SELECT + ' where p.id = $1', [rows[0].id]);
      return res.status(201).json(full[0]);
    }

    if (req.method === 'PATCH') {
      const id = (req.query && req.query.id) || (req.body && req.body.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const o = clean(req.body || {});
      const keys = Object.keys(o);
      if (!keys.length) return res.status(400).json({ error: 'Nada para atualizar' });
      // status anterior (para notificar mudança de coluna)
      let prevStatus = null;
      if (o.status) { const cur = await sql('select status from posts where id = $1', [id]); prevStatus = cur.rows[0] && cur.rows[0].status; }
      const sets = keys.map((k, i) => k + ' = $' + (i + 1)).join(', ');
      const vals = keys.map((k) => o[k]);
      vals.push(id);
      const upd = await sql('update posts set ' + sets + ', updated_at = now() where id = $' + vals.length + ' returning id', vals);
      if (!upd.rows.length) return res.status(404).json({ error: 'Post não encontrado' });
      const { rows: full } = await sql(SELECT + ' where p.id = $1', [id]);
      const post = full[0];
      // mudou de coluna → avisa no grupo do WhatsApp (não falha o update se a Evolution cair)
      if (o.status && prevStatus && prevStatus !== o.status) {
        const msg = '🔄 *Acttus OS — mudança de status*\n*' + post.title + '* — ' + (post.client_name || 'sem cliente') +
          '\n' + prevStatus + ' → *' + post.status + '*' + (post.responsible_name ? '\nResponsável: ' + post.responsible_name : '');
        try { await sendText(msg); } catch (e) { /* ignora falha de envio */ }
        try { await sql('insert into notifications (text, kind, link_post_id, whatsapp_sent) values ($1, $2, $3, $4)', ['"' + post.title + '": ' + prevStatus + ' → ' + post.status, 'status', id, true]); } catch (e) {}
      }
      return res.status(200).json(post);
    }

    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      await sql('delete from posts where id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
