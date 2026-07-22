-- =============================================================================
-- Estelamaris — 01 · Schema (enums, tabelas, índices)
-- Modelo de dados conforme CLAUDE.md. Domínio em português; nomes de tabela em EN.
-- =============================================================================

-- ---------- Enums ------------------------------------------------------------
create type public.receipt_status    as enum ('pendente', 'aprovada', 'rejeitada');
create type public.redemption_status as enum ('ativo', 'usado', 'expirado', 'cancelado');

-- ---------- config (linha única, editável) -----------------------------------
create table public.config (
  id                      boolean     primary key default true,
  pontos_por_real         numeric     not null default 1,      -- 1 ponto por R$ 1,00
  mult_bronze             numeric     not null default 1.0,
  mult_prata              numeric     not null default 1.2,
  mult_ouro               numeric     not null default 1.5,
  limite_prata            integer     not null default 500,    -- acumulado p/ Prata
  limite_ouro             integer     not null default 2000,   -- acumulado p/ Ouro
  dias_expiracao_resgate  integer     not null default 30,
  updated_at              timestamptz not null default now(),
  constraint config_singleton check (id = true)                -- força 1 linha só
);
comment on table public.config is 'Parâmetros do programa de pontos (linha única).';

-- ---------- profiles ---------------------------------------------------------
-- 1:1 com auth.users. nome/cpf/telefone preenchidos pelo app depois do cadastro.
-- pontos_saldo/pontos_acumulados/nivel SÓ mudam via funções SECURITY DEFINER.
create table public.profiles (
  id                 uuid        primary key references auth.users (id) on delete cascade,
  nome               text,
  cpf                text,
  telefone           text,
  pontos_saldo       integer     not null default 0 check (pontos_saldo >= 0),
  pontos_acumulados  integer     not null default 0 check (pontos_acumulados >= 0),
  nivel              text        not null default 'bronze'
                                 check (nivel in ('bronze', 'prata', 'ouro')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
-- CPF único (quando preenchido)
create unique index profiles_cpf_key on public.profiles (cpf) where cpf is not null;

-- ---------- receipts (notas fiscais) -----------------------------------------
create table public.receipts (
  id               uuid                  primary key default gen_random_uuid(),
  user_id          uuid                  not null references public.profiles (id) on delete cascade,
  status           public.receipt_status not null default 'pendente',
  valor            numeric(12,2),                    -- preenchido pela IA (n8n)
  data_compra      date,
  estabelecimento  text,
  cnpj             text,
  chave_acesso     text,
  hash_dedupe      text,                             -- anti-duplicação
  pontos_gerados   integer               not null default 0,
  ai_result        jsonb,                            -- resposta bruta da IA
  motivo_rejeicao  text,
  storage_path     text,                             -- caminho no bucket "notas"
  created_at       timestamptz           not null default now(),
  processed_at     timestamptz
);
-- Dedupe: uma nota (hash) só pode ser creditada uma vez.
create unique index receipts_hash_dedupe_key on public.receipts (hash_dedupe)
  where hash_dedupe is not null;
create index receipts_user_id_idx on public.receipts (user_id);
create index receipts_status_idx  on public.receipts (status);

-- ---------- rewards (catálogo) -----------------------------------------------
create table public.rewards (
  id            uuid        primary key default gen_random_uuid(),
  titulo        text        not null,
  descricao     text,
  custo_pontos  integer     not null check (custo_pontos > 0),
  ativo         boolean     not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- redemptions (resgates) -------------------------------------------
create table public.redemptions (
  id            uuid                     primary key default gen_random_uuid(),
  user_id       uuid                     not null references public.profiles (id) on delete cascade,
  reward_id     uuid                     not null references public.rewards (id),
  codigo        text                     not null,
  custo_pontos  integer                  not null,
  status        public.redemption_status not null default 'ativo',
  created_at    timestamptz              not null default now(),
  expires_at    timestamptz,
  used_at       timestamptz
);
create unique index redemptions_codigo_key on public.redemptions (codigo);
create index redemptions_user_id_idx on public.redemptions (user_id);

-- ---------- points_ledger (extrato) ------------------------------------------
-- Fonte de verdade auditável de cada movimentação. pontos: + crédito / - débito.
create table public.points_ledger (
  id             bigint generated always as identity primary key,
  user_id        uuid        not null references public.profiles (id) on delete cascade,
  tipo           text        not null check (tipo in ('credito', 'debito')),
  pontos         integer     not null,                -- assinado
  saldo_apos     integer,                             -- snapshot do saldo
  receipt_id     uuid        references public.receipts (id),
  redemption_id  uuid        references public.redemptions (id),
  descricao      text,
  created_at     timestamptz not null default now()
);
create index points_ledger_user_id_idx on public.points_ledger (user_id, created_at desc);
