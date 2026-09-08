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
  valor             numeric(12,2) not null check (valor >= 0),
  metodo            text,
  categoria         text not null,
  descricao         text default '',
  forma_pagamento   text default 'À vista',
  tipo_recorrencia  text default 'Pontual',
  dia_recorrencia   smallint,   -- dia de vencimento/pagamento (Mensal / Parcelada)
  pagar_no_vencimento boolean not null default false,  -- trava a data no vencimento
  dia_semana        smallint,   -- 0=Dom .. 6=Sáb (Semanal); null = sem dia fixo
  valor_sessao      numeric(12,2), -- Semanal: valor por sessão
  semanas           jsonb,       -- Semanal: datas marcadas do mês (["YYYY-MM-DD", ...])
  proxima_data      date,
  competencia       date not null default date_trunc('month', now())::date,
  status            text default 'Ativa',
  grupo_id          uuid,        -- liga as ocorrências de uma recorrência / parcelamento
  pendente          boolean not null default false,  -- ocorrência "mês seguinte" aguardando OK
  parcela_num       smallint,    -- nº da parcela (1..N); só Parcelada
  parcelas_total    smallint,    -- N
  valor_total       numeric(12,2),
  quitada           boolean not null default false,  -- parcela zerada por quitação
  quitado_em        date,        -- competência em que o parcelamento foi quitado
  user_id           uuid default auth.uid(),
  criado_em         timestamptz default now()
);

create index if not exists transacoes_tipo_data_idx   on public.transacoes (tipo, data);
create index if not exists transacoes_grupo_idx       on public.transacoes (grupo_id, competencia);
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
  categoria_tipo    text check (categoria_tipo in ('entradas', 'saidas')),  -- só Categoria: receita x despesa
  cor               text,   -- cor do "chip" (categoria / método / recorrência)
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

-- ============================================================
-- Feriados (adicionado depois — aplicado via migração "create_feriados")
-- Nacionais: calculados no front (js/feriados.js). Uma linha origem='nacional'
-- só existe quando o usuário desativa/reativa um deles, ou ao sincronizar
-- com a BrasilAPI. Feriados origem='usuario' são livres (criar/apagar).
-- ============================================================
create table if not exists public.feriados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data date not null,
  nome text not null,
  origem text not null default 'usuario' check (origem in ('nacional','usuario')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, data, origem)
);
alter table public.feriados enable row level security;
create policy "feriados_select_own" on public.feriados for select using (user_id = auth.uid());
create policy "feriados_insert_own" on public.feriados for insert with check (user_id = auth.uid());
create policy "feriados_update_own" on public.feriados for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "feriados_delete_own" on public.feriados for delete using (user_id = auth.uid());
create index if not exists feriados_user_data_idx on public.feriados (user_id, data);

-- Feriados: categorias (migração "feriados_categorias")
alter table public.feriados drop constraint if exists feriados_origem_check;
alter table public.feriados add column if not exists oficial boolean not null default false;
alter table public.feriados add constraint feriados_origem_check
  check (origem in ('nacional','estadual','municipal'));
alter table public.feriados alter column origem set default 'municipal';
-- oficial = true: calculado/sincronizado (não apagável, só desativável)
-- oficial = false: criado pelo usuário (apagável)
