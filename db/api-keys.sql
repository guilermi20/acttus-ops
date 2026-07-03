-- Acttus OS — chaves de API para integrações externas (Zapier, Make, n8n, etc.)
-- Idempotente: pode rodar várias vezes. Rode isto uma vez no seu banco Neon
-- (SQL Editor do Neon, ou `npm run db:setup` já inclui este bloco via schema.sql).
--
-- Autenticação: o gateway valida pela HASH (sha256). A coluna key_plain é opcional
-- e guarda a chave em texto SÓ para chaves ligadas a um usuário (ex.: "chave do Bigode"),
-- para o painel de admin poder re-exibir/copiar. Só admins leem isso.

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,                               -- rótulo da integração
  key_prefix text not null,                          -- início da chave, para exibir (ex.: act_live_1a2b)
  key_hash text not null unique,                     -- sha256(chave completa) — usado na validação
  key_plain text,                                    -- chave em texto (só p/ chaves de usuário, re-copiáveis)
  user_id uuid references users(id) on delete cascade, -- dono opcional da chave
  scopes jsonb not null default '["read"]',          -- ["read"] ou ["read","write"]
  rate_limit int not null default 120,               -- requisições por minuto (0 = ilimitado)
  rate_count int not null default 0,                 -- contador da janela atual
  rate_window_start timestamptz,                     -- início da janela de 60s atual
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Para bancos que já tinham a tabela antes destas colunas:
alter table api_keys add column if not exists key_plain text;
alter table api_keys add column if not exists user_id uuid references users(id) on delete cascade;
alter table api_keys add column if not exists rate_limit int not null default 120;
alter table api_keys add column if not exists rate_count int not null default 0;
alter table api_keys add column if not exists rate_window_start timestamptz;

create index if not exists api_keys_hash_idx on api_keys(key_hash);
create index if not exists api_keys_active_idx on api_keys(revoked_at);
create index if not exists api_keys_user_idx on api_keys(user_id);
