// Gerência das chaves de API — protegida pelo LOGIN (token HMAC) de um ADMIN.
// (Não confundir com a autenticação POR chave usada em /api/v1/*.)
//   GET    /api/apikeys        → lista as chaves (admin vê inclusive key_plain, quando guardada)
//   POST   /api/apikeys        → cria; body: { name?, scopes?, user_id?, rate_limit?, store_plain? }
//   DELETE /api/apikeys?id=…   → revoga a chave
import { sql, requireAuth } from '../lib/db.js';
import { generateApiKey } from '../lib/apikey.js';

async function requireAdmin(req, res) {
  const uid = requireAuth(req, res);
  if (!uid) return null;
  const { rows } = await sql`select role from users where id = ${uid} limit 1`;
  if (!rows.length || rows[0].role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem gerenciar chaves de API.' });
    return null;
  }
  return uid;
}

export default async function handler(req, res) {
  try {
    const uid = await requireAdmin(req, res);
    if (!uid) return;

    if (req.method === 'GET') {
      // admin: pode ver key_plain (só existe para chaves de usuário re-copiáveis)
      const { rows } = await sql`
        select k.id, k.name, k.key_prefix, k.key_plain, k.user_id, u.name as user_name,
               k.scopes, k.rate_limit, k.rate_count, k.last_used_at, k.revoked_at, k.created_at,
               cb.name as created_by_name
        from api_keys k
        left join users u on u.id = k.user_id
        left join users cb on cb.id = k.created_by
        order by k.created_at desc`;
      return res.status(200).json({ keys: rows });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const userId = b.user_id || null;

      // nome: usa o informado, ou deriva do usuário dono
      let name = String(b.name || '').trim().slice(0, 80);
      if (!name && userId) {
        const u = await sql`select name from users where id = ${userId} limit 1`;
        if (!u.rows.length) return res.status(400).json({ error: 'Usuário (user_id) não encontrado.' });
        name = 'Chave de ' + u.rows[0].name;
      }
      if (!name) return res.status(400).json({ error: 'Dê um nome à chave (ex.: "Zapier", "n8n produção").' });

      let scopes = Array.isArray(b.scopes) ? b.scopes.filter((s) => s === 'read' || s === 'write') : ['read'];
      if (!scopes.includes('read')) scopes.unshift('read'); // write sem read não faz sentido
      scopes = Array.from(new Set(scopes));

      let rateLimit = parseInt(b.rate_limit, 10);
      if (!Number.isFinite(rateLimit) || rateLimit < 0) rateLimit = 120; // padrão 120/min; 0 = ilimitado

      // guarda a chave em texto? padrão: sim quando é chave de usuário (p/ re-copiar), senão não
      const storePlain = b.store_plain === undefined ? !!userId : !!b.store_plain;

      const { full, prefix, hash } = generateApiKey();
      const { rows } = await sql`
        insert into api_keys (name, key_prefix, key_hash, key_plain, user_id, scopes, rate_limit, created_by)
        values (${name}, ${prefix}, ${hash}, ${storePlain ? full : null}, ${userId},
                ${JSON.stringify(scopes)}::jsonb, ${rateLimit}, ${uid})
        returning id, name, key_prefix, user_id, scopes, rate_limit, created_at`;
      // `key` só é retornada AGORA (e depois em key_plain, se store_plain).
      return res.status(201).json({ ...rows[0], key: full, aviso: storePlain ? 'Chave salva — o admin poderá copiá-la de novo depois.' : 'Guarde esta chave agora — ela não será mostrada de novo.' });
    }

    if (req.method === 'DELETE') {
      const id = req.query && req.query.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      const { rows } = await sql`update api_keys set revoked_at = now() where id = ${id} and revoked_at is null returning id`;
      if (!rows.length) return res.status(404).json({ error: 'Chave não encontrada ou já revogada.' });
      return res.status(200).json({ ok: true, id });
    }

    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
}
