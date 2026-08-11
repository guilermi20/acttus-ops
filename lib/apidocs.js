// Gera, a partir do REGISTRY, o documento de descoberta (JSON simples) e a
// especificação OpenAPI 3.0 — que ferramentas de integração (n8n, Make,
// Postman, Insomnia, Custom GPT Actions) importam para plugar a API sozinhas.
import { REGISTRY, RESOURCE_NAMES } from './apiRegistry.js';

// URL base pública desta requisição, ex.: https://acttus-ops.vercel.app
function baseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  return proto + '://' + host;
}

// Discovery: resposta amigável do GET /api/v1
export function discovery(req) {
  const base = baseUrl(req) + '/api/v1';
  const resources = {};
  for (const name of RESOURCE_NAMES) {
    const cfg = REGISTRY[name];
    resources[name] = {
      description: cfg.label,
      list: 'GET ' + base + '/' + name,
      get: 'GET ' + base + '/' + name + '/{id}',
      filters: Object.keys(cfg.filters || {}),
      writable: !!cfg.writable,
      write: cfg.writable
        ? { create: 'POST ' + base + '/' + name, update: 'PATCH ' + base + '/' + name + '/{id}', delete: 'DELETE ' + base + '/' + name + '/{id}' }
        : null,
    };
  }
  return {
    name: 'Acttus OS API',
    version: 'v1',
    base_url: base,
    auth: {
      type: 'api_key',
      how: 'Envie sua chave no header "X-Api-Key: SUA_CHAVE" (ou "Authorization: Bearer SUA_CHAVE").',
      scopes: { read: 'permite GET', write: 'permite POST/PATCH/DELETE' },
    },
    conventions: {
      list_response: '{ "data": [ ... ], "meta": { "limit", "offset", "count" } }',
      item_response: '{ "data": { ... } }',
      error_response: '{ "error": "mensagem" }',
      pagination: 'querystring ?limit= (padrão 50, máx 200) e ?offset=',
    },
    endpoints: {
      ping: 'GET ' + base + '/ping  (valida a chave)',
      openapi: 'GET ' + base + '/openapi.json  (spec para importar em ferramentas)',
      webhook_ghl: 'POST ' + base + '/webhooks/ghl  (CRM: cliente ganho → cria o cliente e avisa o grupo; escopo write)',
    },
    resources,
  };
}

// Converte um recurso do REGISTRY em schema de propriedades OpenAPI (para o body de escrita).
function fieldsToSchema(fields) {
  const props = {};
  const required = [];
  for (const [name, def] of Object.entries(fields || {})) {
    let p;
    if (def.type === 'json') p = { type: 'object', description: 'objeto ou lista JSON' };
    else if (def.type === 'bool') p = { type: 'boolean' };
    else if (def.type === 'int') p = { type: 'integer' };
    else if (def.type === 'num') p = { type: 'number' };
    else if (def.type === 'date') p = { type: 'string', format: 'date', example: '2026-07-03' };
    else if (def.type === 'uuid') p = { type: 'string', format: 'uuid' };
    else if (def.type === 'enum') p = { type: 'string', enum: def.enum };
    else p = { type: 'string' };
    if (def.max) p.maxLength = def.max;
    props[name] = p;
    if (def.required) required.push(name);
  }
  return { type: 'object', properties: props, required: required.length ? required : undefined };
}

export function openapi(req) {
  const server = baseUrl(req) + '/api/v1';
  const paths = {};

  const listQueryParams = (cfg) => {
    const params = Object.keys(cfg.filters || {}).map((f) => ({
      name: f, in: 'query', required: false, schema: { type: 'string' },
      description: 'filtro por ' + f,
    }));
    params.push({ name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 200 } });
    params.push({ name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } });
    return params;
  };

  for (const name of RESOURCE_NAMES) {
    const cfg = REGISTRY[name];
    const tag = name;
    const bodySchema = fieldsToSchema(cfg.fields);

    const collection = {
      get: {
        tags: [tag], summary: 'Lista ' + cfg.label, operationId: 'list_' + name.replace(/-/g, '_'),
        parameters: listQueryParams(cfg),
        responses: { 200: { description: 'ok' }, 401: { description: 'sem chave' }, 403: { description: 'sem escopo' } },
      },
    };
    if (cfg.writable) {
      collection.post = {
        tags: [tag], summary: 'Cria ' + cfg.label, operationId: 'create_' + name.replace(/-/g, '_'),
        requestBody: { required: true, content: { 'application/json': { schema: bodySchema } } },
        responses: { 201: { description: 'criado' }, 400: { description: 'dados inválidos' }, 403: { description: 'precisa do escopo write' } },
      };
    }
    paths['/' + name] = collection;

    const item = {
      get: {
        tags: [tag], summary: 'Detalhe de ' + cfg.label, operationId: 'get_' + name.replace(/-/g, '_'),
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'ok' }, 404: { description: 'não encontrado' } },
      },
    };
    if (cfg.writable) {
      item.patch = {
        tags: [tag], summary: 'Atualiza ' + cfg.label, operationId: 'update_' + name.replace(/-/g, '_'),
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: bodySchema } } },
        responses: { 200: { description: 'atualizado' }, 404: { description: 'não encontrado' }, 403: { description: 'precisa do escopo write' } },
      };
      item.delete = {
        tags: [tag], summary: 'Exclui ' + cfg.label, operationId: 'delete_' + name.replace(/-/g, '_'),
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'excluído' }, 404: { description: 'não encontrado' }, 403: { description: 'precisa do escopo write' } },
      };
    }
    paths['/' + name + '/{id}'] = item;
  }

  paths['/ping'] = {
    get: {
      tags: ['_meta'], summary: 'Valida a chave e retorna nome + escopos', operationId: 'ping',
      responses: { 200: { description: 'chave válida' }, 401: { description: 'chave inválida' } },
    },
  };

  return {
    openapi: '3.0.3',
    info: {
      title: 'Acttus OS API',
      version: '1.0.0',
      description: 'API do Acttus OS para integrações externas. Autenticação por chave de API (header X-Api-Key). Escopo "read" para leitura, "write" para escrita.',
    },
    servers: [{ url: server }],
    security: [{ ApiKeyHeader: [] }, { BearerAuth: [] }],
    tags: RESOURCE_NAMES.map((n) => ({ name: n, description: REGISTRY[n].label })),
    paths,
    components: {
      securitySchemes: {
        ApiKeyHeader: { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
        BearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
  };
}
