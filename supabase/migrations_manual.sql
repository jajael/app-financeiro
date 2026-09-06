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
