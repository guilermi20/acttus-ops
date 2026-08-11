// Registro dos recursos expostos pela API pública (/api/v1/*).
// Fonte única de verdade: o gateway (api/v1/[...resource].js) e a spec OpenAPI
// (lib/apidocs.js) são gerados a partir daqui. Para expor um recurso novo,
// basta adicionar uma entrada — nada mais precisa mudar.
//
// Cada recurso:
//   table        nome da tabela (para INSERT/UPDATE/DELETE)
//   listSql      SELECT (com joins/aliases) usado em list e detalhe; colunas = o que a API expõe
//   idCol        coluna de id qualificada usada no WHERE do detalhe (ex.: 'p.id')
//   orderBy      ordenação padrão da listagem
//   hasUpdatedAt se true, o UPDATE também seta updated_at = now()
//   filters      querystring aceita na listagem → { col, op, type? }
//   fields       campos graváveis (POST/PATCH) → { type, required?, max?, enum? }
//                types: text | enum | uuid | date | bool | int | num | json

import { SECTORS } from './sectors.js';

const POST_SELECT = `
  select p.id, p.client_id, c.name as client_name, c.is_internal,
         p.title, p.funnel_stage, p.post_type, p.channel, p.status, p.notes,
         to_char(p.pub_date,'YYYY-MM-DD') as pub_date, to_char(p.due_date,'YYYY-MM-DD') as due_date,
         p.pub_time, p.responsible_id, u.name as responsible_name,
         p.caption, p.media, p.kind, p.reject_reason, p.sector, p.created_at, p.updated_at
  from posts p
  left join clients c on c.id = p.client_id
  left join users u on u.id = p.responsible_id`;

export const REGISTRY = {
  posts: {
    label: 'Publicações do calendário editorial',
    table: 'posts',
    listSql: POST_SELECT,
    idCol: 'p.id',
    orderBy: 'p.pub_date nulls last, p.pub_time nulls last, p.created_at',
    hasUpdatedAt: true,
    writable: true,
    filters: {
      client_id: { col: 'p.client_id', op: '=' },
      responsible_id: { col: 'p.responsible_id', op: '=' },
      status: { col: 'p.status', op: '=' },
      funnel_stage: { col: 'p.funnel_stage', op: '=' },
      post_type: { col: 'p.post_type', op: '=' },
      channel: { col: 'p.channel', op: '=' },
      kind: { col: 'p.kind', op: '=' },
      sector: { col: 'p.sector', op: '=' },
      from: { col: 'p.pub_date', op: '>=' },
      to: { col: 'p.pub_date', op: '<=' },
    },
    fields: {
      client_id: { type: 'uuid' },
      title: { type: 'text', max: 300, required: true },
      funnel_stage: { type: 'enum', enum: ['topo', 'meio', 'fundo'] },
      post_type: { type: 'enum', enum: ['carrossel', 'reels', 'estatico'] },
      channel: { type: 'enum', enum: ['organico', 'trafego'] },
      status: { type: 'enum', enum: ['Agendado', 'Em produção', 'Aguardando aprovação', 'Modificação', 'Finalizado', 'Postado'] },
      notes: { type: 'text' },
      pub_date: { type: 'date' },
      due_date: { type: 'date' },
      pub_time: { type: 'enum', enum: ['12:00', '18:00'] },
      responsible_id: { type: 'uuid' },
      caption: { type: 'text' },
      media: { type: 'json' },
      kind: { type: 'enum', enum: ['post', 'gravacao'] },
      sector: { type: 'enum', enum: SECTORS },
      reject_reason: { type: 'text' },
    },
  },

  clients: {
    label: 'Clientes da agência',
    table: 'clients',
    listSql: `select id, name, is_internal, stage, cover_url, avatar_url, planned_months, metrics, ghl_id, created_at from clients`,
    idCol: 'id',
    orderBy: 'name',
    hasUpdatedAt: false,
    writable: true,
    filters: {
      is_internal: { col: 'is_internal', op: '=', type: 'bool' },
      stage: { col: 'stage', op: '=' },
      ghl_id: { col: 'ghl_id', op: '=' },
    },
    fields: {
      name: { type: 'text', max: 200, required: true },
      is_internal: { type: 'bool' },
      stage: { type: 'enum', enum: ['onboarding', 'ongoing', 'offboarding', 'churn'] },
      cover_url: { type: 'text' },
      avatar_url: { type: 'text' },
      planned_months: { type: 'json' },
      metrics: { type: 'json' },
      ghl_id: { type: 'text', max: 120 },
    },
  },

  ideas: {
    label: 'Banco de ideias',
    table: 'ideas',
    listSql: `select i.id, i.client_id, c.name as client_name, i.title, i.notes, i.status, i.source, i.sector, i.created_at
              from ideas i left join clients c on c.id = i.client_id`,
    idCol: 'i.id',
    orderBy: 'i.created_at desc',
    hasUpdatedAt: false,
    writable: true,
    filters: {
      client_id: { col: 'i.client_id', op: '=' },
      status: { col: 'i.status', op: '=' },
      source: { col: 'i.source', op: '=' },
      sector: { col: 'i.sector', op: '=' },
    },
    fields: {
      client_id: { type: 'uuid' },
      title: { type: 'text', max: 300, required: true },
      notes: { type: 'text', max: 2000 },
      status: { type: 'text', max: 40 },
      source: { type: 'text', max: 40 },
      sector: { type: 'enum', enum: SECTORS },
    },
  },

  projects: {
    label: 'Projetos internos',
    table: 'projects',
    listSql: `select p.id, p.name, p.description, p.responsible_id, u.name as responsible_name,
                     p.status, p.attachments, p.sector, p.created_at, p.updated_at
              from projects p left join users u on u.id = p.responsible_id`,
    idCol: 'p.id',
    orderBy: 'p.created_at desc',
    hasUpdatedAt: true,
    writable: true,
    filters: {
      status: { col: 'p.status', op: '=' },
      responsible_id: { col: 'p.responsible_id', op: '=' },
      sector: { col: 'p.sector', op: '=' },
    },
    fields: {
      name: { type: 'text', max: 200, required: true },
      description: { type: 'text' },
      responsible_id: { type: 'uuid' },
      status: { type: 'text', max: 40 },
      attachments: { type: 'json' },
      sector: { type: 'enum', enum: SECTORS },
    },
  },

  'project-tasks': {
    label: 'Tarefas de projeto',
    table: 'project_tasks',
    listSql: `select t.id, t.project_id, pr.name as project_name, t.title, t.responsible_id,
                     u.name as responsible_name, to_char(t.due_date,'YYYY-MM-DD') as due_date,
                     t.status, t.notes, t.created_at, t.updated_at
              from project_tasks t
              left join projects pr on pr.id = t.project_id
              left join users u on u.id = t.responsible_id`,
    idCol: 't.id',
    orderBy: 't.due_date nulls last, t.created_at',
    hasUpdatedAt: true,
    writable: true,
    filters: {
      project_id: { col: 't.project_id', op: '=' },
      responsible_id: { col: 't.responsible_id', op: '=' },
      status: { col: 't.status', op: '=' },
    },
    fields: {
      project_id: { type: 'uuid', required: true },
      title: { type: 'text', max: 300, required: true },
      responsible_id: { type: 'uuid' },
      due_date: { type: 'date' },
      status: { type: 'text', max: 40 },
      notes: { type: 'text' },
    },
  },

  campaigns: {
    label: 'Campanhas de tráfego pago',
    table: 'campaigns',
    listSql: `select c.id, c.client_id, cl.name as client_name, c.name, c.platform, c.objective, c.status,
                     c.budget, to_char(c.start_date,'YYYY-MM-DD') as start_date, to_char(c.end_date,'YYYY-MM-DD') as end_date,
                     c.responsible_id, u.name as responsible_name, c.notes, c.attachments, c.sector,
                     c.created_at, c.updated_at
              from campaigns c
              left join clients cl on cl.id = c.client_id
              left join users u on u.id = c.responsible_id`,
    idCol: 'c.id',
    orderBy: 'c.created_at desc',
    hasUpdatedAt: true,
    writable: true,
    filters: {
      client_id: { col: 'c.client_id', op: '=' },
      status: { col: 'c.status', op: '=' },
      platform: { col: 'c.platform', op: '=' },
      responsible_id: { col: 'c.responsible_id', op: '=' },
      sector: { col: 'c.sector', op: '=' },
      from: { col: 'c.start_date', op: '>=' },
      to: { col: 'c.end_date', op: '<=' },
    },
    fields: {
      client_id: { type: 'uuid' },
      name: { type: 'text', max: 200, required: true },
      platform: { type: 'enum', enum: ['meta', 'google', 'tiktok', 'linkedin', 'outro'] },
      objective: { type: 'text', max: 300 },
      status: { type: 'enum', enum: ['Planejamento', 'Ativa', 'Pausada', 'Encerrada'] },
      budget: { type: 'num' },
      start_date: { type: 'date' },
      end_date: { type: 'date' },
      responsible_id: { type: 'uuid' },
      notes: { type: 'text' },
      attachments: { type: 'json' },
      sector: { type: 'enum', enum: SECTORS },
    },
  },

  meetings: {
    label: 'Reuniões / atas',
    table: 'meetings',
    listSql: `select id, title, to_char(meeting_date,'YYYY-MM-DD') as meeting_date, category,
                     participants, attachments, notes, sector, created_at, updated_at from meetings`,
    idCol: 'id',
    orderBy: 'meeting_date desc nulls last, created_at desc',
    hasUpdatedAt: true,
    writable: true,
    filters: {
      category: { col: 'category', op: '=' },
      sector: { col: 'sector', op: '=' },
      from: { col: 'meeting_date', op: '>=' },
      to: { col: 'meeting_date', op: '<=' },
    },
    fields: {
      title: { type: 'text', max: 300, required: true },
      meeting_date: { type: 'date' },
      category: { type: 'text', max: 80 },
      participants: { type: 'json' },
      attachments: { type: 'json' },
      notes: { type: 'text' },
      sector: { type: 'enum', enum: SECTORS },
    },
  },

  routines: {
    label: 'Rotinas / tarefas pessoais',
    table: 'routines',
    listSql: `select r.id, r.owner_id, u.name as owner_name, r.title, r.notes,
                     to_char(r.due_date,'YYYY-MM-DD') as due_date, r.done, r.created_at, r.updated_at
              from routines r left join users u on u.id = r.owner_id`,
    idCol: 'r.id',
    orderBy: 'r.due_date nulls last, r.created_at',
    hasUpdatedAt: true,
    writable: true,
    filters: {
      owner_id: { col: 'r.owner_id', op: '=' },
      done: { col: 'r.done', op: '=', type: 'bool' },
    },
    fields: {
      owner_id: { type: 'uuid', required: true },
      title: { type: 'text', max: 300, required: true },
      notes: { type: 'text' },
      due_date: { type: 'date' },
      done: { type: 'bool' },
    },
  },

  // Somente leitura (sem `writable`): expõe a equipe SEM o CPF (que é credencial de login).
  users: {
    label: 'Usuários / equipe (somente leitura, sem CPF)',
    table: 'users',
    listSql: `select id, name, email, phone, role, sectors, created_at from users`,
    idCol: 'id',
    orderBy: 'name',
    hasUpdatedAt: false,
    writable: false,
    filters: {
      role: { col: 'role', op: '=' },
    },
    fields: {},
  },

  // Somente leitura: o log cru dos webhooks recebidos (hoje, o do GHL).
  // É por aqui que se confere o payload real de um disparo antes de mapear
  // campos novos para o card do cliente.
  'webhook-events': {
    label: 'Webhooks recebidos (somente leitura)',
    table: 'webhook_events',
    listSql: `select w.id, w.source, w.event, w.payload, w.client_id, c.name as client_name,
                     w.status, w.error, w.created_at
              from webhook_events w left join clients c on c.id = w.client_id`,
    idCol: 'w.id',
    orderBy: 'w.created_at desc',
    hasUpdatedAt: false,
    writable: false,
    filters: {
      source: { col: 'w.source', op: '=' },
      status: { col: 'w.status', op: '=' },
      event: { col: 'w.event', op: '=' },
    },
    fields: {},
  },

  // Somente leitura.
  notifications: {
    label: 'Notificações (somente leitura)',
    table: 'notifications',
    listSql: `select id, text, kind, link_post_id, created_at, read_at, whatsapp_sent from notifications`,
    idCol: 'id',
    orderBy: 'created_at desc',
    hasUpdatedAt: false,
    writable: false,
    filters: {
      kind: { col: 'kind', op: '=' },
    },
    fields: {},
  },
};

export const RESOURCE_NAMES = Object.keys(REGISTRY);
