// Conexão com o Postgres (Neon, via integração Vercel) + gate de auth leve (HMAC).
// Nada aqui é exposto ao navegador — só roda nas funções serverless.
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

function connString() {
  var c = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!c) throw new Error('Variável de banco ausente (defina DATABASE_URL na Vercel).');
  return c;
}

// Conexão preguiçosa: inicializa só no 1º uso (dentro do try/catch do handler),
// para um DATABASE_URL ausente virar erro legível em vez de derrubar a função.
// fullResults:true → as queries retornam { rows, ... } (igual ao driver pg).
let _sql = null;
function getSql() { if (!_sql) _sql = neon(connString(), { fullResults: true }); return _sql; }
export function sql() { return getSql().apply(null, arguments); }

const SECRET = process.env.APP_SECRET || 'dev-insecure-secret-change-me';

export function onlyDigits(s) {
  return String(s == null ? '' : s).replace(/\D/g, '');
}

// token = base64url(userId) + "." + HMAC(userId)
export function makeToken(userId) {
  const sig = crypto.createHmac('sha256', SECRET).update(String(userId)).digest('base64url');
  return Buffer.from(String(userId)).toString('base64url') + '.' + sig;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  let userId;
  try { userId = Buffer.from(parts[0], 'base64url').toString('utf8'); } catch { return null; }
  const expect = crypto.createHmac('sha256', SECRET).update(userId).digest('base64url');
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expect);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

function bearer(req) {
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

// Retorna o userId se autenticado; senão responde 401 e retorna null.
export function requireAuth(req, res) {
  const uid = verifyToken(bearer(req));
  if (!uid) { res.status(401).json({ error: 'Não autenticado' }); return null; }
  return uid;
}

// Como requireAuth, mas busca o usuário no banco — necessário onde a resposta
// depende do PERFIL ou dos SETORES (o token só carrega o id). Retorna
// { id, name, role, sectors } ou null (já tendo respondido 401/404).
export async function requireAuthUser(req, res) {
  const uid = requireAuth(req, res);
  if (!uid) return null;
  const { rows } = await getSql()`select id, name, role, sectors from users where id = ${uid} limit 1`;
  if (!rows.length) { res.status(401).json({ error: 'Usuário não encontrado' }); return null; }
  const u = rows[0];
  return { id: u.id, name: u.name, role: u.role || 'member', sectors: Array.isArray(u.sectors) ? u.sectors : [] };
}
