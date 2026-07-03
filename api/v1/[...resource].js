// Gateway público da API do Acttus OS — /api/v1/*
// Rota curinga (catch-all) da Vercel: um só arquivo atende todos os recursos.
//   GET    /api/v1                 → descoberta (via api/v1/index.js)
//   GET    /api/v1/ping            → valida a chave
//   GET    /api/v1/openapi.json    → spec p/ importar em ferramentas (sem chave)
//   GET    /api/v1/{recurso}       → lista (escopo read)
//   GET    /api/v1/{recurso}/{id}  → detalhe (escopo read)
//   POST   /api/v1/{recurso}       → cria (escopo write)
//   PATCH  /api/v1/{recurso}/{id}  → atualiza (escopo write)
//   DELETE /api/v1/{recurso}/{id}  → exclui (escopo write)
import { sql } from '../../lib/db.js';
import { requireApiKey, applyCors } from '../../lib/apikey.js';
import { REGISTRY } from '../../lib/apiRegistry.js';
import { discovery, openapi } from '../../lib/apidocs.js';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

// Monta o WHERE a partir dos filtros aceitos pelo recurso e da querystring.
// Exportado (além do handler default) só para testes — a Vercel usa só o default.
export function buildWhere(filters, query, startAt) {
  const clauses = [];
  const params = [];
  let n = startAt || 0;
  for (const [key, def] of Object.entries(filters || {})) {
    let val = query[key];
    if (val === undefined || val === '') continue;
    if (def.type === 'bool') val = val === true || val === 'true' || val === '1';
    else if (def.type === 'int') val = parseInt(val, 10);
    params.push(val);
    n++;
    clauses.push(def.col + ' ' + def.op + ' $' + n);
  }
  return { text: clauses.length ? ' where ' + clauses.join(' and ') : '', params };
}

// Valida/limpa o corpo de escrita conforme os campos permitidos do recurso.
// partial=true (PATCH) não exige os campos required ausentes.
export function cleanBody(fields, body, partial) {
  const values = {};
  const jsonCols = [];
  const errors = [];
  body = body || {};
  for (const [col, def] of Object.entries(fields || {})) {
    const has = Object.prototype.hasOwnProperty.call(body, col);
    if (!has) {
      if (!partial && def.required) errors.push('"' + col + '" é obrigatório');
      continue;
    }
    let v = body[col];
    switch (def.type) {
      case 'text':
        v = v == null ? '' : String(v);
        if (def.max) v = v.slice(0, def.max);
        break;
      case 'enum':
        v = v == null || v === '' ? null : String(v);
        if (v !== null && !def.enum.includes(v)) { errors.push('"' + col + '" inválido (use: ' + def.enum.join(', ') + ')'); continue; }
        break;
      case 'uuid':
        v = v || null;
        break;
      case 'date':
        v = v || null;
        break;
      case 'bool':
        v = v === true || v === 'true' || v === 1 || v === '1';
        break;
      case 'int':
        v = v == null || v === '' ? null : parseInt(v, 10);
        break;
      case 'json':
        v = JSON.stringify(v == null ? [] : v);
        jsonCols.push(col);
        break;
      default:
        v = v == null ? null : String(v);
    }
    if (!partial && def.required && (v === null || v === '')) errors.push('"' + col + '" é obrigatório');
    values[col] = v;
  }
  return { values, jsonCols, errors };
}

function sendJson(res, code, obj) { res.status(code).json(obj); }

export default async function handler(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Segmentos após /api/v1 — ex.: ['posts'] ou ['posts', '<id>']
  const seg = (req.query && req.query.resource) || [];
  const parts = Array.isArray(seg) ? seg : [seg];
  const resource = parts[0];
  const id = parts[1];

  try {
    // ---- rotas especiais ---------------------------------------------------
    if (!resource) return sendJson(res, 200, discovery(req));
    if (resource === 'openapi.json' || resource === 'openapi') return sendJson(res, 200, openapi(req));
    if (resource === 'docs') return sendJson(res, 200, discovery(req));
    if (resource === 'ping') {
      const key = await requireApiKey(req, res, 'read');
      if (!key) return;
      const { rows } = await sql`select now() as now`;
      return sendJson(res, 200, { ok: true, key: { name: key.name, scopes: key.scopes }, now: rows[0].now });
    }

    // ---- recurso válido? ---------------------------------------------------
    const cfg = REGISTRY[resource];
    if (!cfg) {
      return sendJson(res, 404, { error: 'Recurso "' + resource + '" não existe. Veja GET /api/v1 para a lista.' });
    }

    // ---- LISTA: GET /{recurso} ---------------------------------------------
    if (req.method === 'GET' && !id) {
      if (!(await requireApiKey(req, res, 'read'))) return;
      const q = req.query || {};
      let limit = parseInt(q.limit, 10); if (!Number.isFinite(limit) || limit <= 0) limit = DEFAULT_LIMIT; if (limit > MAX_LIMIT) limit = MAX_LIMIT;
      let offset = parseInt(q.offset, 10); if (!Number.isFinite(offset) || offset < 0) offset = 0;
      const w = buildWhere(cfg.filters, q, 0);
      const params = w.params.slice();
      params.push(limit); const limPos = params.length;
      params.push(offset); const offPos = params.length;
      const text = cfg.listSql + w.text + ' order by ' + cfg.orderBy + ' limit $' + limPos + ' offset $' + offPos;
      const { rows } = await sql(text, params);
      return sendJson(res, 200, { data: rows, meta: { limit, offset, count: rows.length } });
    }

    // ---- DETALHE: GET /{recurso}/{id} --------------------------------------
    if (req.method === 'GET' && id) {
      if (!(await requireApiKey(req, res, 'read'))) return;
      const { rows } = await sql(cfg.listSql + ' where ' + cfg.idCol + ' = $1', [id]);
      if (!rows.length) return sendJson(res, 404, { error: 'Não encontrado' });
      return sendJson(res, 200, { data: rows[0] });
    }

    // ---- daqui pra baixo é escrita: exige recurso gravável -----------------
    if (['POST', 'PATCH', 'DELETE'].includes(req.method) && !cfg.writable) {
      return sendJson(res, 405, { error: 'O recurso "' + resource + '" é somente leitura.' });
    }

    // ---- CRIA: POST /{recurso} ---------------------------------------------
    if (req.method === 'POST' && !id) {
      if (!(await requireApiKey(req, res, 'write'))) return;
      const { values, jsonCols, errors } = cleanBody(cfg.fields, req.body, false);
      if (errors.length) return sendJson(res, 400, { error: errors.join('; ') });
      const cols = Object.keys(values);
      if (!cols.length) return sendJson(res, 400, { error: 'Envie ao menos um campo.' });
      const params = [];
      const placeholders = cols.map((c) => { params.push(values[c]); return jsonCols.includes(c) ? '$' + params.length + '::jsonb' : '$' + params.length; });
      const ins = await sql('insert into ' + cfg.table + ' (' + cols.join(', ') + ') values (' + placeholders.join(', ') + ') returning id', params);
      const { rows } = await sql(cfg.listSql + ' where ' + cfg.idCol + ' = $1', [ins.rows[0].id]);
      return sendJson(res, 201, { data: rows[0] });
    }

    // ---- ATUALIZA: PATCH /{recurso}/{id} -----------------------------------
    if (req.method === 'PATCH' && id) {
      if (!(await requireApiKey(req, res, 'write'))) return;
      const { values, jsonCols, errors } = cleanBody(cfg.fields, req.body, true);
      if (errors.length) return sendJson(res, 400, { error: errors.join('; ') });
      const cols = Object.keys(values);
      if (!cols.length) return sendJson(res, 400, { error: 'Nada para atualizar.' });
      const params = [];
      const sets = cols.map((c) => { params.push(values[c]); return jsonCols.includes(c) ? c + ' = $' + params.length + '::jsonb' : c + ' = $' + params.length; });
      if (cfg.hasUpdatedAt) sets.push('updated_at = now()');
      params.push(id);
      const upd = await sql('update ' + cfg.table + ' set ' + sets.join(', ') + ' where id = $' + params.length + ' returning id', params);
      if (!upd.rows.length) return sendJson(res, 404, { error: 'Não encontrado' });
      const { rows } = await sql(cfg.listSql + ' where ' + cfg.idCol + ' = $1', [id]);
      return sendJson(res, 200, { data: rows[0] });
    }

    // ---- EXCLUI: DELETE /{recurso}/{id} ------------------------------------
    if (req.method === 'DELETE' && id) {
      if (!(await requireApiKey(req, res, 'write'))) return;
      const del = await sql('delete from ' + cfg.table + ' where id = $1 returning id', [id]);
      if (!del.rows.length) return sendJson(res, 404, { error: 'Não encontrado' });
      return sendJson(res, 200, { ok: true, id });
    }

    // método/rota não coberto
    if (!id && (req.method === 'PATCH' || req.method === 'DELETE')) return sendJson(res, 400, { error: 'Informe o id: ' + req.method + ' /api/v1/' + resource + '/{id}' });
    if (id && req.method === 'POST') return sendJson(res, 400, { error: 'Para criar, use POST /api/v1/' + resource + ' (sem id).' });
    return sendJson(res, 405, { error: 'Método não permitido.' });
  } catch (e) {
    return sendJson(res, 500, { error: String(e && e.message ? e.message : e) });
  }
}
