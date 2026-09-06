# Migração: Google Sheets → Supabase (+ login)

O app deixou de usar Google Apps Script + Google Sheets e passou a gravar
direto no **Supabase** (Postgres). O acesso é protegido por **Supabase Auth**
com **Google** (Supabase Auth OAuth).

## Arquitetura

```
Antes:  index.html + js/  →  fetch  →  Apps Script (.gs)  →  Google Sheets
Depois: index.html + js/  →  supabase-js  →  Supabase (Postgres + Auth)
```

## O que mudou no código

| Arquivo | Mudança |
|---|---|
| `index.html` | carrega `supabase-js` (CDN), `js/auth.js` e `js/recorrencia.js`; botão "Sair" |
| `js/config.js` | `SCRIPT_URL` → `SUPABASE_URL` + `SUPABASE_KEY` + cliente `sb` |
| `js/auth.js` | **novo** — tela de login (Google OAuth), sessão, logout |
| `js/api.js` | CRUD de transações reescrito com o cliente Supabase |
| `js/menus-api.js` | CRUD de menus reescrito com o cliente Supabase |
| `js/recorrencia.js` | **novo** — cálculo de `proxima_data` (portado de `recorrencia.gs`) |
| `js/main.js` | inicialização exige sessão antes de carregar dados |
| `supabase/schema.sql` | **novo** — tabelas, RLS (authenticated) e seed dos menus |
| `supabase/migrations_manual.sql` | **novo** — limpeza do projeto antigo + troca de RLS |

**Removido** (backend antigo): `google-apps-script/`, `appsscript.json`,
`.clasp.json`, `js/app.js`, `js/config.example.js` e os docs de setup do
Apps Script/Sheets em `md/`.

## Setup

### 1. Banco
Abra o [SQL Editor](https://supabase.com/dashboard/project/lbfnjxzthbclvgnszway/sql/new):
- Primeira vez: rode `supabase/schema.sql`.
- Depois: rode `supabase/migrations_manual.sql` (remove tabelas antigas e
  fecha o RLS para usuários autenticados).

### 2. Auth (painel do Supabase)
- **Authentication → Providers → Google**: habilitar e configurar (ver `supabase/GOOGLE_LOGIN.md`).
- **Authentication → URL Configuration → Redirect URLs**: adicionar
  - `http://localhost:8777/*` (dev)
  - `https://<seu-usuario>.github.io/*` (GitHub Pages)
- Opcional: **Authentication → Users → Add user** para pré-cadastrar seu e-mail.

O e-mail padrão do Supabase é limitado (poucos por hora) — suficiente para uso
pessoal. Para volume maior, configurar SMTP próprio.

## Modelo de dados

**`transacoes`** — `id`, `tipo` (`entradas`/`saidas`), `data`, `valor`,
`metodo`, `categoria`, `descricao`, `forma_pagamento`, `tipo_recorrencia`,
`proxima_data`, `status`, `criado_em`.

**`menu_itens`** — `id`, `tipo` (`Categoria`/`Método`/`Recorrência`), `nome`,
`descricao`, `status`, `criado_em`.

## Segurança

Com o RLS em `authenticated`, a chave publishable no front-end sozinha não dá
acesso aos dados — é preciso uma sessão válida (login Google). Como é app de
usuário único, qualquer usuário logado tem acesso total; se um dia virar
multiusuário, adicionar `user_id` nas tabelas e trocar as policies por
`auth.uid()`.
