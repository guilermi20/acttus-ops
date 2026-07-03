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
//                types: text | enum | uuid | date | bool | int | json

const POST_SELECT = `
  select p.id, p.client_id, c.name as client_name, c.is_internal,
         p.title, p.funnel_stage, p.post_type, p.channel, p.status, p.notes,
         to_char(p.pub_date,'YYYY-MM-DD') as pub_date, to_char(p.due_date,'YYYY-MM-DD') as due_date,
         p.pub_time, p.responsible_id, u.name as responsible_name,
         p.caption, p.media, p.kind, p.reject_reason, p.created_at, p.updated_at
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
      reject_reason: { type: 'text' },
    },
  },

  clients: {
    label: 'Clientes da agência',
    table: 'clients',
    listSql: `select id, name, is_internal, cover_url, avatar_url, planned_months, metrics, created_at from clients`,
    idCol: 'id',
    orderBy: 'name',
    hasUpdatedAt: false,
    writable: true,
    filters: {
      is_internal: { col: 'is_internal', op: '=', type: 'bool' },
    },
    fields: {
      name: { type: 'text', max: 200, required: true },
      is_internal: { type: 'bool' },
      cover_url: { type: 'text' },
      avatar_url: { type: 'text' },
      planned_months: { type: 'json' },
      metrics: { type: 'json' },
    },
  },

  ideas: {
    label: 'Banco de ideias',
    table: 'ideas',
    listSql: `select i.id, i.client_id, c.name as client_name, i.title, i.notes, i.status, i.source, i.created_at
              from ideas i left join clients c on c.id = i.client_id`,
    idCol: 'i.id',
    orderBy: 'i.created_at desc',
    hasUpdatedAt: false,
    writable: true,
    filters: {
      client_id: { col: 'i.client_id', op: '=' },
      status: { col: 'i.status', op: '=' },
      source: { col: 'i.source', op: '=' },
    },
    fields: {
      client_id: { type: 'uuid' },
      title: { type: 'text', max: 300, required: true },
      notes: { type: 'text', max: 2000 },
      status: { type: 'text', max: 40 },
      source: { type: 'text', max: 40 },
    },
  },

  projects: {
    label: 'Projetos internos',
    table: 'projects',
    listSql: `select p.id, p.name, p.description, p.responsible_id, u.name as responsible_name,
                     p.status, p.attachments, p.created_at, p.updated_at
              from projects p left join users u on u.id = p.responsible_id`,
    idCol: 'p.id',
    orderBy: 'p.created_at desc',
    hasUpdatedAt: true,
    writable: true,
    filters: {
      status: { col: 'p.status', op: '=' },
      responsible_id: { col: 'p.responsible_id', op: '=' },
    },
    fields: {
      name: { type: 'text', max: 200, required: true },
      description: { type: 'text' },
      responsible_id: { type: 'uuid' },
      status: { type: 'text', max: 40 },
      attachments: { type: 'json' },
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

  meetings: {
    label: 'Reuniões / atas',
    table: 'meetings',
    listSql: `select id, title, to_char(meeting_date,'YYYY-MM-DD') as meeting_date, category,
                     participants, attachments, notes, created_at, updated_at from meetings`,
    idCol: 'id',
    orderBy: 'meeting_date desc nulls last, created_at desc',
    hasUpdatedAt: true,
    writable: true,
    filters: {
      category: { col: 'category', op: '=' },
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
    listSql: `select id, name, email, phone, role, created_at from users`,
    idCol: 'id',
    orderBy: 'name',
    hasUpdatedAt: false,
    writable: false,
    filters: {
      role: { col: 'role', op: '=' },
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
