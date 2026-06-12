// Aplica db/schema.sql e db/seed.sql no Postgres (Neon).
// Uso local:
//   1) vercel env pull .env.local      (puxa DATABASE_URL do projeto)
//   2) npm run db:setup
// Alternativa sem CLI: cole o conteúdo de db/schema.sql e db/seed.sql no
// "SQL Editor" do Neon (Vercel → Storage → seu banco → Open in Neon → SQL Editor).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

// Divide um arquivo .sql em statements individuais (sem plpgsql, split simples por ';').
function statements(text) {
  return text
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => {
      const noComments = s.split(/\r?\n/).filter((l) => !l.trim().startsWith('--')).join('\n').trim();
      return noComments.length > 0;
    });
}

async function run() {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!conn) {
    console.error('✗ DATABASE_URL não definido. Rode antes:  vercel env pull .env.local');
    process.exit(1);
  }
  const sql = neon(conn);
  for (const file of ['schema.sql', 'seed.sql']) {
    console.log('→ aplicando ' + file + ' ...');
    const stmts = statements(readFileSync(join(root, 'db', file), 'utf8'));
    for (const stmt of stmts) await sql(stmt);
  }
  console.log('✓ Banco pronto (tabelas + dados de exemplo).');
}

run().catch((e) => { console.error('✗ Falha:', e.message || e); process.exit(1); });
