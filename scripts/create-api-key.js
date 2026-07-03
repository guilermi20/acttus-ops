// Cria uma chave de API pela linha de comando (sem precisar da UI).
// Uso:
//   vercel env pull .env.local                 # puxa DATABASE_URL (uma vez)
//   node --env-file=.env.local scripts/create-api-key.js "Nome da chave" read,write
//
// O 2º argumento (escopos) é opcional; padrão: read
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

const name = (process.argv[2] || '').trim();
const scopesArg = (process.argv[3] || 'read').split(',').map((s) => s.trim()).filter(Boolean);

if (!name) {
  console.error('✗ Informe um nome:  node --env-file=.env.local scripts/create-api-key.js "Zapier" read,write');
  process.exit(1);
}

let scopes = scopesArg.filter((s) => s === 'read' || s === 'write');
if (!scopes.includes('read')) scopes.unshift('read');
scopes = Array.from(new Set(scopes));

const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!conn) {
  console.error('✗ DATABASE_URL não definido. Rode antes:  vercel env pull .env.local');
  process.exit(1);
}

const secret = crypto.randomBytes(24).toString('hex');
const full = 'act_live_' + secret;
const prefix = full.slice(0, 16);
const hash = crypto.createHash('sha256').update(full).digest('hex');

const sql = neon(conn);

(async () => {
  await sql`
    insert into api_keys (name, key_prefix, key_hash, scopes)
    values (${name}, ${prefix}, ${hash}, ${JSON.stringify(scopes)}::jsonb)`;
  console.log('✓ Chave criada.');
  console.log('  Nome:    ' + name);
  console.log('  Escopos: ' + scopes.join(', '));
  console.log('');
  console.log('  CHAVE (copie agora — não será mostrada de novo):');
  console.log('  ' + full);
  console.log('');
  console.log('  Teste:  curl -H "X-Api-Key: ' + full + '" https://SEU-DOMINIO.vercel.app/api/v1/ping');
})().catch((e) => { console.error('✗ Falha:', e.message || e); process.exit(1); });
