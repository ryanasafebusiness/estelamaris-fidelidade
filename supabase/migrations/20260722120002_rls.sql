-- =============================================================================
-- Estelamaris — 02 · Privilégios + RLS
-- Estratégia: privilégios estreitos (inclusive por COLUNA) + RLS por linha.
-- O cliente NUNCA escreve pontos/status. service_role ignora RLS (uso do n8n).
-- =============================================================================

-- Zera os grants amplos que o Supabase concede por padrão a anon/authenticated,
-- para reconceder apenas o mínimo necessário abaixo.
revoke all on public.config        from anon, authenticated;
revoke all on public.profiles      from anon, authenticated;
revoke all on public.receipts      from anon, authenticated;
revoke all on public.rewards       from anon, authenticated;
revoke all on public.redemptions   from anon, authenticated;
revoke all on public.points_ledger from anon, authenticated;

-- Ativa RLS em TODAS as tabelas.
alter table public.config        enable row level security;
alter table public.profiles      enable row level security;
alter table public.receipts      enable row level security;
alter table public.rewards       enable row level security;
alter table public.redemptions   enable row level security;
alter table public.points_ledger enable row level security;

-- ---------- config: leitura pública das regras -------------------------------
grant select on public.config to anon, authenticated;
create policy "config: leitura" on public.config
  for select to anon, authenticated using (true);
-- (sem policy de write => só service_role/admin altera as regras)

-- ---------- profiles ---------------------------------------------------------
-- Lê a própria linha; atualiza SOMENTE nome/cpf/telefone (grant por coluna).
-- Sem UPDATE nas colunas de pontos/nivel => tentativa dá "permission denied".
grant select on public.profiles to authenticated;
grant update (nome, cpf, telefone) on public.profiles to authenticated;

create policy "profiles: seleciona a própria" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "profiles: atualiza a própria" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- receipts ---------------------------------------------------------
-- Insere SOMENTE user_id/storage_path (grant por coluna) => valor/status/hash
-- ficam nos defaults (pendente, 0). Lê as próprias. Sem UPDATE/DELETE.
grant select on public.receipts to authenticated;
grant insert (user_id, storage_path) on public.receipts to authenticated;

create policy "receipts: seleciona as próprias" on public.receipts
  for select to authenticated using (user_id = (select auth.uid()));

create policy "receipts: insere a própria (pendente/zerada)" on public.receipts
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pendente'
    and pontos_gerados = 0
  );

-- ---------- rewards: leitura pública das ativas ------------------------------
grant select on public.rewards to anon, authenticated;
create policy "rewards: lê ativas" on public.rewards
  for select to anon, authenticated using (ativo = true);

-- ---------- redemptions: só lê as próprias (insert só via função) ------------
grant select on public.redemptions to authenticated;
create policy "redemptions: seleciona as próprias" on public.redemptions
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- points_ledger: só lê o próprio (insert só via função) ------------
grant select on public.points_ledger to authenticated;
create policy "ledger: seleciona o próprio" on public.points_ledger
  for select to authenticated using (user_id = (select auth.uid()));
