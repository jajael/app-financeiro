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
  proxima_data      date,
  status            text default 'Ativa',
  criado_em         timestamptz default now()
);

create index if not exists transacoes_tipo_data_idx  on public.transacoes (tipo, data);
create index if not exists transacoes_proxima_data_idx on public.transacoes (proxima_data);

-- ---------- Tabela de menus (categorias / métodos / recorrências) ----------
create table if not exists public.menu_itens (
  id         bigint generated always as identity primary key,
  tipo       text not null check (tipo in ('Categoria', 'Método', 'Recorrência')),
  nome       text not null,
  descricao  text default '',
  status     text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  criado_em  timestamptz default now()
);

create unique index if not exists menu_itens_tipo_nome_idx on public.menu_itens (tipo, nome);

-- ============================================================
-- Row Level Security
-- Acesso somente para usuários autenticados (Supabase Auth / magic link).
-- App de usuário único: qualquer usuário logado tem acesso total.
-- Para multiusuário, adicionar coluna user_id e trocar por auth.uid().
-- ============================================================
alter table public.transacoes  enable row level security;
alter table public.menu_itens  enable row level security;

drop policy if exists "anon full access transacoes" on public.transacoes;
drop policy if exists "auth full access transacoes" on public.transacoes;
create policy "auth full access transacoes" on public.transacoes
  for all to authenticated using (true) with check (true);

drop policy if exists "anon full access menu_itens" on public.menu_itens;
drop policy if exists "auth full access menu_itens" on public.menu_itens;
create policy "auth full access menu_itens" on public.menu_itens
  for all to authenticated using (true) with check (true);

-- ============================================================
-- Seed inicial dos menus (banco começa do zero)
-- ============================================================
insert into public.menu_itens (tipo, nome) values
  ('Categoria', 'Salário'),
  ('Categoria', 'Freelance'),
  ('Categoria', 'Investimento'),
  ('Categoria', 'Bônus'),
  ('Categoria', 'Devolução'),
  ('Categoria', 'Alimentação'),
  ('Categoria', 'Alimentação app'),
  ('Categoria', 'Assinatura'),
  ('Categoria', 'Bebida alcoólica'),
  ('Categoria', 'Casa'),
  ('Categoria', 'Compras'),
  ('Categoria', 'Compras online'),
  ('Categoria', 'Lazer'),
  ('Categoria', 'Mercado'),
  ('Categoria', 'Saúde'),
  ('Categoria', 'Serviços'),
  ('Categoria', 'Transporte app'),
  ('Categoria', 'Transporte público'),
  ('Categoria', 'Outro'),
  ('Método', 'Débito'),
  ('Método', 'Crédito'),
  ('Método', 'PIX'),
  ('Método', 'Dinheiro'),
  ('Método', 'Transferência'),
  ('Recorrência', 'Pontual'),
  ('Recorrência', 'Mensal'),
  ('Recorrência', 'Último útil do mês'),
  ('Recorrência', 'Vencimento'),
  ('Recorrência', 'Parcelada')
on conflict (tipo, nome) do nothing;
