-- ============================================================
-- App Financeiro - Schema Supabase (Postgres)
-- Substitui o Google Sheets como banco de dados.
--
-- Como aplicar:
--   Supabase Dashboard > SQL Editor > New query > cole tudo > Run
--   (ou: supabase db push / MCP apply_migration)
-- ============================================================

-- ---------- Tabela de transações (entradas + saídas) ----------
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
  dia_recorrencia   smallint,
  eh_vencimento     boolean not null default false,
  proxima_data      date,
  cartao_id         bigint,
  competencia       date not null default date_trunc('month', now())::date,
  status            text default 'Ativa',
  user_id           uuid default auth.uid(),
  criado_em         timestamptz default now()
);

create index if not exists transacoes_tipo_data_idx    on public.transacoes (tipo, data);
create index if not exists transacoes_competencia_idx   on public.transacoes (tipo, competencia);
create index if not exists transacoes_proxima_data_idx  on public.transacoes (proxima_data);

-- ---------- Cartões de crédito ----------
create table if not exists public.cartoes (
  id                bigint generated always as identity primary key,
  nome              text not null,
  dia_fechamento    smallint not null check (dia_fechamento between 1 and 31),
  dia_vencimento    smallint not null check (dia_vencimento between 1 and 31),
  melhor_dia_compra smallint check (melhor_dia_compra between 1 and 31),
  status            text not null default 'Ativo' check (status in ('Ativo','Inativo')),
  user_id           uuid default auth.uid(),
  criado_em         timestamptz default now()
);

alter table public.transacoes
  drop constraint if exists transacoes_cartao_id_fkey,
  add constraint transacoes_cartao_id_fkey
    foreign key (cartao_id) references public.cartoes(id) on delete set null;

-- ---------- Tabela de menus (categorias / métodos / recorrências) ----------
create table if not exists public.menu_itens (
  id         bigint generated always as identity primary key,
  tipo       text not null check (tipo in ('Categoria', 'Método', 'Recorrência')),
  nome       text not null,
  descricao  text default '',
  status     text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  user_id    uuid default auth.uid(),
  criado_em  timestamptz default now()
);

create unique index if not exists menu_itens_user_tipo_nome_idx on public.menu_itens (user_id, tipo, nome);

-- ============================================================
-- Row Level Security — multiusuário
-- Cada usuário (incluindo visitantes anônimos) só enxerga as próprias linhas.
-- Login: Google OAuth ou "Testar sem cadastro" (signInAnonymously).
-- Requer "Anonymous sign-ins" habilitado em Authentication.
-- ============================================================
alter table public.transacoes  enable row level security;
alter table public.menu_itens  enable row level security;
alter table public.cartoes     enable row level security;

drop policy if exists "anon full access transacoes" on public.transacoes;
drop policy if exists "auth full access transacoes" on public.transacoes;
drop policy if exists "own transacoes" on public.transacoes;
create policy "own transacoes" on public.transacoes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "anon full access menu_itens" on public.menu_itens;
drop policy if exists "auth full access menu_itens" on public.menu_itens;
drop policy if exists "own menu_itens" on public.menu_itens;
create policy "own menu_itens" on public.menu_itens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "auth full access cartoes" on public.cartoes;
drop policy if exists "own cartoes" on public.cartoes;
create policy "own cartoes" on public.cartoes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Os menus padrão são criados pelo app no primeiro acesso de cada usuário
-- (js/menus-api.js -> semearMenusPadraoSeVazio), então não há seed global aqui.
