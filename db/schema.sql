-- Acttus OS — schema do banco (Postgres)
-- Idempotente: pode rodar várias vezes.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cpf text not null unique,
  email text not null,
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
  pub_time text check (pub_time in ('12:00','18:00')),
  responsible_id uuid references users(id) on delete set null,
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

-- Observação: updated_at é setado explicitamente no UPDATE (api/posts.js),
-- evitando trigger/plpgsql para o schema poder ser aplicado statement-a-statement.
