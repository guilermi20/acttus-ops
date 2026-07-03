-- Acttus OS — schema do banco (Postgres)
-- Idempotente: pode rodar várias vezes.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_internal boolean not null default false,
  share_token text,
  cover_url text,
  avatar_url text,
  planned_months jsonb not null default '[]',
  metrics jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create unique index if not exists clients_share_token_idx on clients(share_token);

-- Banco de ideias (sugestões de clientes pelo painel + ideias internas)
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  title text not null,
  notes text not null default '',
  status text not null default 'nova',
  source text not null default 'painel',
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cpf text not null unique,
  email text not null,
  phone text,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  title text not null,
  funnel_stage text not null default 'topo' check (funnel_stage in ('topo','meio','fundo')),
  post_type text not null default 'estatico' check (post_type in ('carrossel','reels','estatico')),
  channel text not null default 'organico' check (channel in ('organico','trafego')),
  status text not null default 'Agendado'
    check (status in ('Agendado','Em produção','Aguardando aprovação','Modificação','Finalizado','Postado')),
  notes text not null default '',
  pub_date date,
  due_date date,
  pub_time text check (pub_time in ('12:00','18:00')),
  responsible_id uuid references users(id) on delete set null,
  reject_reason text,
  caption text,
  media jsonb not null default '[]',
  kind text not null default 'post',
  date_moved text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_pub_date_idx on posts(pub_date);
create index if not exists posts_updated_idx on posts(updated_at);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  kind text not null default 'info',
  link_post_id uuid references posts(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  whatsapp_sent boolean not null default false
);

-- Reuniões (anotações estilo Notion: título, data, participantes, categoria, pauta)
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date,
  category text not null default '',
  participants jsonb not null default '[]',
  attachments jsonb not null default '[]',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rotinas (tarefas pessoais, não-posts; dono = usuário)
create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projetos internos + tarefas do projeto
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  responsible_id uuid references users(id) on delete set null,
  status text not null default 'Ativo',
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  responsible_id uuid references users(id) on delete set null,
  due_date date,
  status text not null default 'A fazer',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chaves de API para integrações externas (Zapier, Make, n8n, etc.).
-- A chave completa é mostrada só na criação; guardamos apenas o hash (sha256).
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  key_plain text,
  user_id uuid references users(id) on delete cascade,
  scopes jsonb not null default '["read"]',
  rate_limit int not null default 120,
  rate_count int not null default 0,
  rate_window_start timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists api_keys_hash_idx on api_keys(key_hash);
create index if not exists api_keys_active_idx on api_keys(revoked_at);
create index if not exists api_keys_user_idx on api_keys(user_id);

-- Observação: updated_at é setado explicitamente no UPDATE (api/*.js),
-- evitando trigger/plpgsql para o schema poder ser aplicado statement-a-statement.
