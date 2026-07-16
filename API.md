# Acttus OS — API pública (v1)

API REST para plugar o Acttus OS em ferramentas de automação (Zapier, Make, n8n,
Pipedream, Custom GPT Actions, planilhas, etc.). O acesso é por **chave de API**.

- **Base URL:** `https://SEU-DOMINIO.vercel.app/api/v1`
- **Autenticação:** header `X-Api-Key: SUA_CHAVE` (ou `Authorization: Bearer SUA_CHAVE`)
- **Formato:** JSON em tudo (request e response)
- **Escopos:** `read` (GET) e `write` (POST/PATCH/DELETE). Uma chave `read` não escreve.
- **Rate limit:** por chave (padrão 120 req/min; `0` = ilimitado). Respostas trazem
  `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`; ao estourar → HTTP `429` + `Retry-After`.

> **Painel no app:** admins gerenciam chaves em **Integrações → API & Integrações**
> (criar, revogar, copiar) e a mesma página traz esta documentação embutida. Também dá
> para gerar/copiar a chave de um usuário direto na tela **Usuários** (botão ao lado do nome).

---

## 1. Preparar o banco (uma vez)

A API usa uma tabela nova, `api_keys`. Aplique uma das opções:

- **SQL Editor do Neon:** cole e rode o conteúdo de [`db/api-keys.sql`](db/api-keys.sql); **ou**
- **CLI:** `npm run db:setup` (o `schema.sql` já inclui a tabela, é idempotente).

## 2. Criar uma chave

**Opção A — linha de comando (mais rápido para a 1ª chave):**
```bash
vercel env pull .env.local        # puxa DATABASE_URL (uma vez)
npm run key:create -- "n8n produção" read,write
```
Copie a chave `act_live_...` mostrada — ela **não** é exibida de novo.

**Opção B — pela API (precisa estar logado como admin no app):**
```bash
curl -X POST https://SEU-DOMINIO.vercel.app/api/apikeys \
  -H "Authorization: Bearer TOKEN_DE_LOGIN_DO_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Zapier","scopes":["read","write"]}'
```
Rotas de gestão (admin): `GET /api/apikeys` (lista), `POST /api/apikeys` (cria),
`DELETE /api/apikeys?id=…` (revoga). O segredo só aparece na criação; depois só o prefixo.

## 3. Testar
```bash
curl -H "X-Api-Key: act_live_xxx" https://SEU-DOMINIO.vercel.app/api/v1/ping
# → { "ok": true, "key": { "name": "...", "scopes": ["read","write"] }, "now": "..." }
```

---

## Endpoints

### Meta
| Método | Rota | Descrição | Escopo |
|---|---|---|---|
| GET | `/api/v1` | Descoberta: recursos, auth e convenções | — |
| GET | `/api/v1/ping` | Valida a chave, devolve nome + escopos | read |
| GET | `/api/v1/openapi.json` | Spec OpenAPI 3.0 (importar em ferramentas) | — |

### Recursos
Todos seguem o mesmo padrão REST:

| Método | Rota | Descrição | Escopo |
|---|---|---|---|
| GET | `/api/v1/{recurso}` | Lista (com filtros + paginação) | read |
| GET | `/api/v1/{recurso}/{id}` | Detalhe de um item | read |
| POST | `/api/v1/{recurso}` | Cria | write |
| PATCH | `/api/v1/{recurso}/{id}` | Atualiza (campos parciais) | write |
| DELETE | `/api/v1/{recurso}/{id}` | Exclui | write |

**Recursos disponíveis:**

| Recurso | Conteúdo | Escrita |
|---|---|---|
| `posts` | Publicações do calendário editorial | ✅ |
| `clients` | Clientes | ✅ |
| `ideas` | Banco de ideias | ✅ |
| `projects` | Projetos internos | ✅ |
| `project-tasks` | Tarefas de projeto | ✅ |
| `meetings` | Reuniões / atas | ✅ |
| `routines` | Rotinas / tarefas pessoais | ✅ |
| `users` | Equipe (sem CPF) | ❌ só leitura |
| `notifications` | Notificações | ❌ só leitura |

---

## Convenções

**Lista** → `{ "data": [ ... ], "meta": { "limit", "offset", "count" } }`
**Item** → `{ "data": { ... } }`
**Erro** → `{ "error": "mensagem" }` (com status HTTP 4xx/5xx)

**Paginação:** `?limit=` (padrão 50, máx 200) e `?offset=`.

**Filtros por recurso** (querystring):
- `posts`: `client_id`, `responsible_id`, `status`, `funnel_stage`, `post_type`, `channel`, `kind`, `from` (pub_date ≥), `to` (pub_date ≤)
- `clients`: `is_internal`, `stage` (`onboarding` | `ongoing` | `offboarding` | `churn`)
- `ideas`: `client_id`, `status`, `source`
- `projects`: `status`, `responsible_id`
- `project-tasks`: `project_id`, `responsible_id`, `status`
- `meetings`: `category`, `from`, `to`
- `routines`: `owner_id`, `done`
- `users`: `role`
- `notifications`: `kind`

---

## Exemplos

**Posts postados de um cliente, últimos 20:**
```bash
curl -H "X-Api-Key: act_live_xxx" \
  "https://SEU-DOMINIO.vercel.app/api/v1/posts?status=Postado&client_id=UUID&limit=20"
```

**Criar um post (precisa de escopo write):**
```bash
curl -X POST "https://SEU-DOMINIO.vercel.app/api/v1/posts" \
  -H "X-Api-Key: act_live_xxx" -H "Content-Type: application/json" \
  -d '{
        "title": "Reels de lançamento",
        "client_id": "UUID-DO-CLIENTE",
        "funnel_stage": "topo",
        "post_type": "reels",
        "status": "Agendado",
        "pub_date": "2026-07-10",
        "pub_time": "18:00"
      }'
```

**Mover um post de status:**
```bash
curl -X PATCH "https://SEU-DOMINIO.vercel.app/api/v1/posts/UUID-DO-POST" \
  -H "X-Api-Key: act_live_xxx" -H "Content-Type: application/json" \
  -d '{ "status": "Finalizado" }'
```

**Excluir uma ideia:**
```bash
curl -X DELETE "https://SEU-DOMINIO.vercel.app/api/v1/ideas/UUID" \
  -H "X-Api-Key: act_live_xxx"
```

---

## Plugar em ferramentas (n8n, Make, Postman, Custom GPT)

A maioria importa a API sozinha a partir da spec OpenAPI:

1. Aponte a ferramenta para `https://SEU-DOMINIO.vercel.app/api/v1/openapi.json`.
2. Configure a autenticação como **API Key no header** `X-Api-Key` com o valor `act_live_...`.
3. Pronto — todas as operações (listar/criar/editar/excluir) aparecem prontas.

Para **Custom GPT Actions**: cole a URL do `openapi.json` em *Import from URL* e use
*Authentication → API Key → Header → X-Api-Key*.

---

## Segurança

- A validação é sempre pelo `sha256` da chave. Chaves de **integração** (sem usuário) não
  guardam o texto — aparecem uma vez só. Chaves **vinculadas a um usuário** guardam o texto
  (`key_plain`) para o admin re-copiar no painel; só admins leem isso.
- Revogue a qualquer momento: `DELETE /api/apikeys?id=…` (efeito imediato).
- Chave `read` nunca altera dados. Dê `write` só a integrações que realmente precisam.
- O CPF dos usuários **nunca** é exposto pela API (é credencial de login).
- Rate limit por chave protege contra abuso; ajuste o `rate_limit` por chave conforme o uso.
- Toda requisição atualiza `last_used_at` — dá para auditar chaves ociosas.
