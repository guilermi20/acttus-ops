# Acttus OS — Calendário Editorial

App full-stack para gerir o calendário editorial da agência: posts por cliente,
funil 50/30/20, board por status, login por CPF+email, dashboards ao vivo e
notificações de tarefas vencidas no WhatsApp (Evolution API).

- **Frontend:** HTML + CSS + JS puro (sem framework) — `index.html`, `styles.css`, `app.js`, `data.js`
- **Backend:** funções serverless da Vercel em `api/` (Node.js)
- **Banco:** Postgres (Neon, via integração nativa da Vercel)
- **Tempo real:** polling a cada 8s (re-renderiza quando há mudança)
- **WhatsApp:** Evolution API. Eventos (status, aprovação do cliente, ideia) vão pro grupo;
  os resumos por cron vão no privado de cada responsável — de manhã (o que é dele) e às 18h
  (o que ele publica amanhã). Demanda sem responsável cai no grupo, para não sumir.

## Estrutura

```
index.html  styles.css  app.js  data.js     # frontend estático
api/                                          # funções serverless
  login.js  users.js  clients.js  posts.js  notifications.js  cron.js
lib/        db.js  whatsapp.js                # módulos compartilhados (não são rotas)
db/         schema.sql  seed.sql             # banco
scripts/    db-setup.js                       # aplica schema+seed
vercel.json  .env.example
```

## Setup (passo a passo)

### 1. Criar o banco (Neon na Vercel)
Vercel → projeto **acttus-ops** → aba **Storage** → **Create Database** → **Neon (Postgres)** → conecte ao projeto.
Isso injeta a variável `DATABASE_URL` automaticamente.

### 2. Criar as tabelas + dados de exemplo
Duas opções:

**a) Pelo SQL Editor do Neon (mais simples):** abra o banco → *Open in Neon* → **SQL Editor** →
cole e rode o conteúdo de [`db/schema.sql`](db/schema.sql), depois [`db/seed.sql`](db/seed.sql).

**b) Pela CLI:**
```bash
vercel env pull .env.local   # puxa DATABASE_URL
npm install
npm run db:setup
```

### 3. Variáveis de ambiente (Vercel → Settings → Environment Variables)
Veja [`.env.example`](.env.example). Defina:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | (criada automaticamente no passo 1) |
| `APP_SECRET` | valor aleatório longo (assina os tokens de login) |
| `EVOLUTION_API_URL` | `https://evolution.ordem.app.br` |
| `EVOLUTION_API_KEY` | a sua API key da Evolution |
| `EVOLUTION_INSTANCE` | o nome da sua instância na Evolution |
| `EVOLUTION_GROUP_ID` | `120363428042165535@g.us` |
| `CRON_SECRET` | valor aleatório (protege o endpoint de cron) |

> A `EVOLUTION_API_KEY` **nunca** vai para o navegador nem para o git — só fica aqui.

### 4. Deploy
`git push` → a Vercel faz o deploy automático. Sem etapa de build.

## Login
Entra-se com **CPF + email** cadastrados. O seed cria logins de exemplo (CPFs placeholder):

| Nome | CPF | Email |
|---|---|---|
| Admin | `000.000.000-00` | admin@acttus.com.br |
| Guilherme | `666.666.666-66` | guilherme@acttus.com.br |

Entre com o Admin, cadastre os usuários reais (com CPF e email de verdade) em **Usuários**,
e depois ajuste/remova os de exemplo.

## Setores
A agência opera em dois setores: **Marketing** e **Tráfego**. O seletor no topo
do menu lateral troca o setor ativo (no espírito do seletor de subcontas do GHL)
e o painel inteiro acompanha: posts, ideias, projetos, reuniões e campanhas
pertencem a um setor; **clientes e usuários são compartilhados**.

Em **Usuários**, o admin marca quais setores cada pessoa acessa — quem tem um
setor só nem vê o seletor. Admin transita em todos.

Para criar um setor novo: uma linha em [`lib/sectors.js`](lib/sectors.js) (servidor)
e uma em `SECTORS`, no topo de [`data.js`](data.js) (navegador).

## Funcionalidades
- **Calendário** unificado por cliente — amarelo = `Acttus - Interno`, rosa = demais clientes.
- **Posts**: board com os 6 status (Agendado → Em produção → Aguardando aprovação → Modificação → Finalizado → Postado), arrasta-e-solta.
- **Funil 50/30/20**: distribuição topo/meio/fundo vs. meta, geral e por cliente.
- **Campos do post**: título, cliente, etapa do funil, tipo (carrossel/reels/estático), canal (orgânico/tráfego), data, horário (12:00/18:00), responsável (lista dinâmica dos usuários), status, observações.
- **Gravações**: agenda do Google embutida + agendamento pelo Calendly. É a agenda do app.
- **Campanhas** (setor Tráfego): mídia paga por cliente — plataforma, objetivo, verba, período, responsável e status.
- **Usuários/Clientes**: cadastro próprio. O dropdown de responsável puxa os usuários automaticamente.
- **WhatsApp**: cron diário envia ao grupo o resumo das tarefas vencidas.
- **Onboarding automático**: ao marcar o cliente como ganho no CRM (GHL), um webhook cria o cliente em `onboarding` e avisa o grupo com o link do Calendly. Veja [`API.md`](API.md#webhooks-de-entrada).

## API pública (integrações externas)
O app é plugável via **API por chave** (`/api/v1/*`) — para Zapier, Make, n8n, Custom GPT, etc.
Leitura e escrita dos conteúdos (posts, clientes, ideias, projetos, reuniões, rotinas…),
autenticada por `X-Api-Key`. Documentação completa e exemplos em [`API.md`](API.md).

Início rápido:
```bash
npm run key:create -- "n8n produção" read,write         # cria a 1ª chave
curl -H "X-Api-Key: act_live_xxx" https://SEU-DOMINIO.vercel.app/api/v1/ping
```

## Testar o WhatsApp manualmente
```bash
# resumo da manhã (DM por responsável) + lembretes do mês + faxina de storage
curl "https://SEU-DOMINIO.vercel.app/api/cron?job=morning&secret=SEU_CRON_SECRET"
curl "https://SEU-DOMINIO.vercel.app/api/cron?job=dms&secret=SEU_CRON_SECRET"     # só os DMs
curl "https://SEU-DOMINIO.vercel.app/api/cron?job=digest&secret=SEU_CRON_SECRET"  # o que publica amanhã
curl "https://SEU-DOMINIO.vercel.app/api/cron?job=gc&secret=SEU_CRON_SECRET"      # só a faxina de storage
```

## Rodar localmente
```bash
npm install
vercel dev   # requer Vercel CLI + DATABASE_URL no .env.local
```

> Observação: as funções e o banco Neon não rodam abrindo o `index.html` direto —
> use `vercel dev` (ou teste no deploy). O frontend estático sozinho mostra só a tela de login.
