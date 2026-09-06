# Migração: Google Sheets → Supabase

O app deixou de usar o Google Apps Script + Google Sheets e passou a gravar
direto no **Supabase** (Postgres) a partir do front-end.

## Arquitetura

```
Antes:  index.html + js/  →  fetch  →  Apps Script (.gs)  →  Google Sheets
Depois: index.html + js/  →  supabase-js  →  Supabase (Postgres)
```

## O que mudou no código

| Arquivo | Mudança |
|---|---|
| `index.html` | carrega `supabase-js` (CDN) e `js/recorrencia.js` |
| `js/config.js` | `SCRIPT_URL` → `SUPABASE_URL` + `SUPABASE_KEY` + cliente `sb` |
| `js/api.js` | CRUD de transações reescrito com o cliente Supabase |
| `js/menus-api.js` | CRUD de menus reescrito com o cliente Supabase |
| `js/recorrencia.js` | **novo** — cálculo de `proxima_data` (portado de `recorrencia.gs`) |
| `supabase/schema.sql` | **novo** — tabelas, RLS e seed dos menus |

O front-end continua igual (mesmos nomes de função). `js/app.js`,
`js/config.example.js` e a pasta `google-apps-script/` ficaram como legado e
podem ser removidos.

## Setup (uma vez)

1. **Criar as tabelas**: abra o projeto no [Supabase](https://supabase.com/dashboard/project/lbfnjxzthbclvgnszway/sql/new),
   cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
2. Pronto. O `SUPABASE_URL` / `SUPABASE_KEY` já estão em `js/config.js`.

## Modelo de dados

**`transacoes`** — `id`, `tipo` (`entradas`/`saidas`), `data`, `valor`,
`metodo`, `categoria`, `descricao`, `forma_pagamento`, `tipo_recorrencia`,
`proxima_data`, `status`, `criado_em`.

**`menu_itens`** — `id`, `tipo` (`Categoria`/`Método`/`Recorrência`), `nome`,
`descricao`, `status`, `criado_em`.

## ⚠️ Segurança

Sem login, o RLS libera leitura/escrita para a chave `anon`, que fica visível
no front-end publicado (GitHub Pages). Para uso pessoal funciona, mas qualquer
pessoa com a URL do site pode ler/gravar seus dados. Próximo passo recomendado:
ativar **Supabase Auth** (e-mail/senha) e trocar as policies para
`auth.uid()`.
