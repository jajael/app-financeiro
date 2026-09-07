-- ============================================================
-- Rodar UMA VEZ no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lbfnjxzthbclvgnszway/sql/new
--
-- 1) Remove as tabelas do projeto antigo (não usadas pelo app novo)
-- 2) Troca o RLS de "anon" para "authenticated" (magic link)
-- ============================================================

-- 1) Limpeza do projeto antigo -------------------------------
drop table if exists public.entradas cascade;
drop table if exists public.saidas cascade;
drop table if exists public.metodos_pagamento cascade;

-- 2) RLS: exigir usuário autenticado ------------------------
drop policy if exists "anon full access transacoes" on public.transacoes;
drop policy if exists "auth full access transacoes" on public.transacoes;
create policy "auth full access transacoes" on public.transacoes
  for all to authenticated using (true) with check (true);

drop policy if exists "anon full access menu_itens" on public.menu_itens;
drop policy if exists "auth full access menu_itens" on public.menu_itens;
create policy "auth full access menu_itens" on public.menu_itens
  for all to authenticated using (true) with check (true);

-- ============================================================
-- 3) Multiusuário + "Testar sem cadastro" (visitante anônimo)
--    (o essencial já foi aplicado via migração; isto cobre reinstalação
--     e a limpeza dos itens de menu órfãos do seed global antigo)
-- ============================================================
alter table public.transacoes add column if not exists user_id uuid;
alter table public.cartoes    add column if not exists user_id uuid;
alter table public.menu_itens add column if not exists user_id uuid;
alter table public.transacoes alter column user_id set default auth.uid();
alter table public.cartoes    alter column user_id set default auth.uid();
alter table public.menu_itens alter column user_id set default auth.uid();

drop index if exists public.menu_itens_tipo_nome_idx;
create unique index if not exists menu_itens_user_tipo_nome_idx
  on public.menu_itens (user_id, tipo, nome);

drop policy if exists "auth full access transacoes" on public.transacoes;
drop policy if exists "own transacoes" on public.transacoes;
create policy "own transacoes" on public.transacoes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "auth full access menu_itens" on public.menu_itens;
drop policy if exists "own menu_itens" on public.menu_itens;
create policy "own menu_itens" on public.menu_itens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "auth full access cartoes" on public.cartoes;
drop policy if exists "own cartoes" on public.cartoes;
create policy "own cartoes" on public.cartoes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- itens de menu do seed global antigo (sem dono) — invisíveis com o novo RLS
delete from public.menu_itens where user_id is null;

-- No painel: Authentication -> Providers -> "Anonymous sign-ins" -> Enable
-- (necessário para o botão "Testar sem cadastro")

-- ============================================================
-- 4) Método de pagamento com detalhes (cartão vira método) + fim da tabela cartoes
-- ============================================================
alter table public.menu_itens
  add column if not exists metodo_kind       text,
  add column if not exists banco             text,
  add column if not exists dia_fechamento    smallint,
  add column if not exists dia_vencimento    smallint,
  add column if not exists melhor_dia_compra smallint;

alter table public.transacoes drop constraint if exists transacoes_cartao_id_fkey;
alter table public.transacoes drop column if exists cartao_id;
drop table if exists public.cartoes;

-- remove "Crédito" que vinha no seed padrão de métodos (agora é criado por banco)
delete from public.menu_itens where tipo = 'Método' and nome = 'Crédito' and metodo_kind is null;

-- ============================================================
-- 5) Recorrência: "Semanal" + "Primeiro dia útil"; "Mensal" -> "Conta"
-- ============================================================
alter table public.transacoes add column if not exists dia_semana smallint;
alter table public.transacoes drop column if exists eh_vencimento;
update public.menu_itens set nome = 'Conta' where tipo = 'Recorrência' and nome = 'Mensal';

-- ============================================================
-- 6) Séries de recorrência (edição/exclusão em cascata para frente)
-- ============================================================
alter table public.transacoes add column if not exists grupo_id uuid;
create index if not exists transacoes_grupo_idx on public.transacoes (grupo_id, competencia);
