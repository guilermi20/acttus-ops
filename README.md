# Acttus OS

Painel de operações da Acttus (contextos **Interno** e **Clientes**). É uma aplicação
estática 100% client-side — sem backend, sem banco de dados e sem chamadas de API.
Toda a interface é renderizada por JavaScript no navegador.

## Estrutura

```
.
├── index.html      # Shell HTML (markup base do app)
├── styles.css      # Estilos (extraídos do HTML original)
├── app.js          # Toda a lógica do app (IIFE em JS puro)
├── vercel.json     # Configuração de deploy do Vercel
├── package.json    # Metadados + scripts de dev local
└── acttus-os (2).html  # Arquivo original (não vai para produção — ver .vercelignore)
```

> A única dependência externa é a fonte **Outfit**, carregada via Google Fonts.

## Rodar localmente

Precisa servir por HTTP (abrir o `index.html` direto via `file://` pode falhar por
causa dos caminhos absolutos `/styles.css` e `/app.js`).

```bash
npm run dev
# abre em http://localhost:3000 usando "npx serve"
```

Ou com Python:

```bash
python -m http.server 3000
```

## Deploy no Vercel

### Opção A — pelo site (mais simples)

1. Suba esta pasta para um repositório no GitHub/GitLab/Bitbucket.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. **Framework Preset:** `Other`. Deixe *Build Command* e *Output Directory* em branco.
4. Clique em **Deploy**.

### Opção B — pela CLI

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # produção
```

Não há etapa de build: o Vercel apenas publica os arquivos estáticos da raiz.
