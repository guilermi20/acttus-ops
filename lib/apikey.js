// Autenticação por CHAVE DE API (para integrações externas).
// Diferente do login por token HMAC (lib/db.js): aqui a identidade é a própria chave.
// A chave completa nunca é guardada — só o sha256. Roda só nas funções serverless.
import { sql } from './db.js';
import crypto from 'node:crypto';

const PREFIX = 'act_live_';

export function hashApiKey(full) {
  return crypto.createHash('sha256').update(String(full || '')).digest('hex');
}

// Gera uma chave nova. Retorna { full, prefix, hash }.
// `full` é o único momento em que a chave existe em texto puro — mostre e descarte.
export function generateApiKey() {
  const secret = crypto.randomBytes(24).toString('hex'); // 48 hex
  const full = PREFIX + secret;
  return { full, prefix: full.slice(0, 16), hash: hashApiKey(full) };
}

// Lê a chave da requisição: header X-Api-Key, ou Authorization: Bearer, ou ?api_key=
function readKey(req) {
  const x = req.headers['x-api-key'] || req.headers['X-Api-Key'];
  if (x) return String(x).trim();
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  const q = req.query && (req.query.api_key || req.query.apikey);
  if (q) return String(q).trim();
  return '';
}

// CORS liberado: a API é pública por chave — a própria chave é o controle de acesso.
export function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// Valida a chave + aplica RATE LIMIT (janela fixa de 60s) numa única query atômica.
// Retorna { id, name, scopes } se ok; senão responde o erro (401/403/429) e retorna null.
// needScope: 'read' | 'write' (opcional) — exige que a chave tenha aquele escopo.
export async function requireApiKey(req, res, needScope) {
  const raw = readKey(req);
  if (!raw) {
    res.status(401).json({ error: 'Chave de API ausente. Envie no header "X-Api-Key: SUA_CHAVE" ou "Authorization: Bearer SUA_CHAVE".' });
    return null;
  }
  const hash = hashApiKey(raw);
  let rows;
  try {
    // Valida por hash, reinicia a janela se passou 60s, incrementa o contador e
    // marca last_used_at — tudo num statement só (funciona entre instâncias serverless).
    ({ rows } = await sql`
      with k as (
        select id, name, scopes, rate_limit, rate_window_start as ws, rate_count as rc
        from api_keys where key_hash = ${hash} and revoked_at is null limit 1
      )
      update api_keys a set
        rate_window_start = case when k.ws is null or k.ws <= now() - interval '60 seconds' then now() else k.ws end,
        rate_count        = case when k.ws is null or k.ws <= now() - interval '60 seconds' then 1 else k.rc + 1 end,
        last_used_at      = now()
      from k where a.id = k.id
      returning a.id, k.name, k.scopes, a.rate_limit, a.rate_count,
        greatest(0, ceil(extract(epoch from (a.rate_window_start + interval '60 seconds' - now()))))::int as reset_in`);
  } catch (e) {
    res.status(500).json({ error: 'Falha ao validar a chave: ' + String(e.message || e) });
    return null;
  }
  if (!rows.length) {
    res.status(401).json({ error: 'Chave de API inválida ou revogada.' });
    return null;
  }
  const key = rows[0];
  const scopes = Array.isArray(key.scopes) ? key.scopes : [];
  const limit = Number(key.rate_limit) || 0;
  const count = Number(key.rate_count) || 0;

  // headers informativos de rate limit (só quando há limite)
  if (limit > 0) {
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
    res.setHeader('X-RateLimit-Reset', String(key.reset_in));
    if (count > limit) {
      res.setHeader('Retry-After', String(key.reset_in));
      res.status(429).json({ error: 'Limite de requisições atingido (' + limit + '/min). Tente de novo em ' + key.reset_in + 's.' });
      return null;
    }
  }

  if (needScope && !scopes.includes(needScope)) {
    res.status(403).json({ error: 'Esta chave não tem o escopo "' + needScope + '". Escopos desta chave: ' + (scopes.join(', ') || '(nenhum)') + '.' });
    return null;
  }
  return { id: key.id, name: key.name, scopes };
}
