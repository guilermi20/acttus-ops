-- Acttus OS — dados iniciais (migração dos exemplos + Acttus - Interno)
-- Idempotente: usa ON CONFLICT. Rode depois do schema.sql.

-- Clientes -------------------------------------------------------------
insert into clients (name, is_internal) values
  ('Acttus - Interno', true),
  ('Andrade & Lima', false),
  ('Costa Advocacia', false),
  ('Pereira & Cia', false),
  ('Vieira Tributário', false),
  ('Lima Empresarial', false),
  ('Mendonça Advogados', false)
on conflict (name) do nothing;

-- Usuários (logins de exemplo — TROQUE OS CPFs por reais depois) ---------
-- Login = CPF + email. CPFs abaixo são placeholders.
insert into users (name, cpf, email) values
  ('Admin',          '00000000000', 'admin@acttus.com.br'),
  ('Mateus Torres',  '11111111111', 'mateus@acttus.com.br'),
  ('Sayan',          '22222222222', 'sayan@acttus.com.br'),
  ('Chacon',         '33333333333', 'chacon@acttus.com.br'),
  ('Dudu',           '44444444444', 'dudu@acttus.com.br'),
  ('Leticia',        '55555555555', 'leticia@acttus.com.br'),
  ('Guilherme',      '66666666666', 'guilherme@acttus.com.br'),
  ('Luiz',           '77777777777', 'luiz@acttus.com.br')
on conflict (cpf) do nothing;

-- Posts de exemplo (junho/2026) — distribuição 50/30/20 (5 topo, 3 meio, 2 fundo)
insert into posts (client_id, title, funnel_stage, post_type, channel, status, notes, pub_date, pub_time, responsible_id)
select c.id, v.title, v.funnel_stage, v.post_type, v.channel, v.status, v.notes, v.pub_date::date, v.pub_time, u.id
from (values
  ('Andrade & Lima',    '3 erros ao escolher um advogado trabalhista',        'topo',  'carrossel', 'organico', 'Agendado',             '', '2026-06-04', '12:00', 'Leticia'),
  ('Acttus - Interno',  'Bastidores da Acttus: como nasce um criativo',       'topo',  'reels',     'organico', 'Em produção',          '', '2026-06-05', '18:00', 'Dudu'),
  ('Pereira & Cia',     'Reforma tributária: o que muda para sua empresa',    'topo',  'estatico',  'trafego',  'Aguardando aprovação', '', '2026-06-08', '12:00', 'Leticia'),
  ('Costa Advocacia',   'Divórcio: as 5 dúvidas mais comuns',                 'topo',  'carrossel', 'organico', 'Agendado',             '', '2026-06-10', '18:00', 'Dudu'),
  ('Vieira Tributário', 'Você está pagando imposto a mais?',                  'topo',  'reels',     'trafego',  'Modificação',          '', '2026-06-12', '12:00', 'Chacon'),
  ('Andrade & Lima',    'Como funciona um processo trabalhista (passo a passo)','meio', 'carrossel', 'organico', 'Agendado',            '', '2026-06-15', '18:00', 'Leticia'),
  ('Lima Empresarial',  'Checklist: sua empresa está em conformidade?',       'meio',  'estatico',  'trafego',  'Em produção',          '', '2026-06-17', '12:00', 'Guilherme'),
  ('Acttus - Interno',  'Cases: os resultados dos nossos clientes',           'meio',  'reels',     'organico', 'Finalizado',           '', '2026-06-19', '18:00', 'Sayan'),
  ('Mendonça Advogados','Agende uma consulta criminalista ainda hoje',        'fundo', 'estatico',  'trafego',  'Agendado',             '', '2026-06-22', '12:00', 'Mateus Torres'),
  ('Costa Advocacia',   'Fale com nosso time: primeira conversa gratuita',    'fundo', 'carrossel', 'trafego',  'Postado',              '', '2026-06-24', '18:00', 'Mateus Torres')
) as v(client, title, funnel_stage, post_type, channel, status, notes, pub_date, pub_time, resp)
join clients c on c.name = v.client
left join users u on u.name = v.resp
where not exists (select 1 from posts p where p.title = v.title);
