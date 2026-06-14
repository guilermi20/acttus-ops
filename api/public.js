// PÚBLICO (sem login), via share_token ?t=:
//  GET  → painel do cliente (publicações do mês)
//  POST → action: 'suggest' (ideia) | 'approve' | 'reject' (de posts em aprovação)
import { sql } from '../lib/db.js';
import { sendGroup } from '../lib/whatsapp.js';

export default async function handler(req, res) {
  const t = (req.query && req.query.t) || (req.body && req.body.t);
  if (!t) return res.status(400).json({ error: 'token ausente' });
  try {
    const c = await sql('select id, name, cover_url, avatar_url, is_internal from clients where share_token = $1', [t]);
    if (!c.rows.length) return res.status(404).json({ error: 'Painel não encontrado' });
    const client = c.rows[0];

    if (req.method === 'GET') {
      const p = await sql(`select id, to_char(pub_date,'YYYY-MM-DD') as pub_date, pub_time, title, post_type, funnel_stage, status, caption, media
        from posts
        where client_id = $1
        order by pub_date nulls last, pub_time nulls last, created_at`, [client.id]);
      const nowRows = await sql('select now() as now');
      return res.status(200).json({
        client: { name: client.name, cover_url: client.cover_url, avatar_url: client.avatar_url, is_internal: client.is_internal },
        posts: p.rows,
        now: nowRows.rows[0].now,
      });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const action = b.action || 'suggest';

      if (action === 'approve' || action === 'reject') {
        const postId = b.post_id;
        if (!postId) return res.status(400).json({ error: 'post_id ausente' });
        const pr = await sql('select id, title, status from posts where id = $1 and client_id = $2', [postId, client.id]);
        if (!pr.rows.length) return res.status(404).json({ error: 'Post não encontrado' });
        const post = pr.rows[0];
        if (action === 'approve') {
          await sql("update posts set status = 'Finalizado', reject_reason = null, updated_at = now() where id = $1", [postId]);
          try { await sendGroup('✅ *Aprovado pelo cliente* — ' + client.name + '\n*' + post.title + '*'); } catch (e) {}
          await sql('insert into notifications (text, kind) values ($1, $2)', [client.name + ' aprovou: ' + post.title, 'approval']);
          return res.status(200).json({ ok: true, status: 'Finalizado' });
        }
        const reason = String(b.reason || '').trim();
        if (!reason) return res.status(400).json({ error: 'Informe o motivo da reprovação' });
        await sql('update posts set status = \'Modificação\', reject_reason = $2, updated_at = now() where id = $1', [postId, reason.slice(0, 2000)]);
        try { await sendGroup('❌ *Reprovado pelo cliente* — ' + client.name + '\n*' + post.title + '*\nMotivo: ' + reason); } catch (e) {}
        await sql('insert into notifications (text, kind) values ($1, $2)', [client.name + ' reprovou: ' + post.title, 'approval']);
        return res.status(200).json({ ok: true, status: 'Modificação' });
      }

      // sugerir ideia (default)
      const title = String(b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Descreva a ideia' });
      await sql`insert into ideas (client_id, title, notes, status, source)
        values (${client.id}, ${title.slice(0, 300)}, ${String(b.notes || '').slice(0, 2000)}, 'nova', 'painel')`;
      await sql('insert into notifications (text, kind) values ($1, $2)', ['Nova ideia sugerida por ' + client.name, 'idea']);
      return res.status(201).json({ ok: true });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
