-- ============================================================
-- App Financeiro - Schema Supabase (Postgres)
-- Substitui o Google Sheets como banco de dados.
--
-- Como aplicar:
--   Supabase Dashboard > SQL Editor > New query > cole tudo > Run
--   (ou: supabase db push / MCP apply_migration)
-- ============================================================

-- ---------- Transações (entradas + saídas) ----------
create table if not exists public.transacoes (
  id                bigint generated always as identity primary key,
  tipo              text not null check (tipo in ('entradas', 'saidas')),
  data              date not null,
  valor             numeric(12,2) not null check (valor > 0),
  metodo            text,
  categoria         text not null,
  descricao         text default '',
  forma_pagamento   text default 'À vista',
  tipo_recorrencia  text default 'Pontual',
  dia_recorrencia   smallint,   -- dia de vencimento (Conta / Parcelada)
  dia_semana        smallint,   -- 0=Dom .. 6=Sáb (Semanal); null = sem dia fixo
  proxima_data      date,
  competencia       date not null default date_trunc('month', now())::date,
  status            text default 'Ativa',
  user_id           uuid default auth.uid(),
  criado_em         timestamptz default now()
);

create index if not exists transacoes_tipo_data_idx   on public.transacoes (tipo, data);
create index if not exists transacoes_competencia_idx  on public.transacoes (tipo, competencia);
create index if not exists transacoes_proxima_data_idx on public.transacoes (proxima_data);

-- ---------- Menus: categorias / métodos / recorrências ----------
-- Métodos guardam os detalhes do meio de pagamento:
--   metodo_kind = 'Dinheiro' | 'PIX/Débito' | 'Crédito'
--   banco                     (PIX/Débito e Crédito)
--   dia_fechamento / dia_vencimento / melhor_dia_compra  (Crédito)
create table if not exists public.menu_itens (
  id                bigint generated always as identity primary key,
  tipo              text not null check (tipo in ('Categoria', 'Método', 'Recorrência')),
  nome              text not null,
  descricao         text default '',
  status            text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  metodo_kind       text,
  banco             text,
  dia_fechamento    smallint,
  dia_vencimento    smallint,
  melhor_dia_compra smallint,
  user_id           uuid default auth.uid(),
  criado_em         timestamptz default now()
);

create unique index if not exists menu_itens_user_tipo_nome_idx on public.menu_itens (user_id, tipo, nome);

-- ============================================================
-- Row Level Security — multiusuário
-- Cada usuário (incluindo visitantes anônimos) só enxerga as próprias linhas.
-- Login: Google OAuth ou "Testar sem cadastro" (signInAnonymously).
-- Requer "Anonymous sign-ins" habilitado em Authentication.
-- ============================================================
alter table public.transacoes enable row level security;
alter table public.menu_itens enable row level security;

drop policy if exists "own transacoes" on public.transacoes;
create policy "own transacoes" on public.transacoes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own menu_itens" on public.menu_itens;
create policy "own menu_itens" on public.menu_itens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Os menus padrão são criados pelo app no primeiro acesso de cada usuário
-- (js/menus-api.js -> semearMenusPadraoSeVazio), então não há seed global aqui.
