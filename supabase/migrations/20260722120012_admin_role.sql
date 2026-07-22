-- =============================================================================
-- Estelamaris — 12 · Papel admin + leitura ampla para admin
-- Coluna 'papel' (cliente|admin). Admin vê tudo (leitura).
-- Promoção a admin é manual: update public.profiles set papel='admin' where id=...
--
-- IMPORTANTE: usa a função is_admin() SECURITY DEFINER. Sem ela, uma policy em
-- profiles que consulta profiles causaria RECURSÃO INFINITA de RLS. is_admin()
-- roda como owner (ignora RLS), quebrando o ciclo.
-- =============================================================================

alter table public.profiles
  add column if not exists papel text not null default 'cliente'
  check (papel in ('cliente', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = '' stable as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and papel = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admin: lê todos os profiles" on public.profiles;
create policy "admin: lê todos os profiles" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "admin: lê todas as receipts" on public.receipts;
create policy "admin: lê todas as receipts" on public.receipts
  for select to authenticated using (public.is_admin());

drop policy if exists "admin: lê todas as redemptions" on public.redemptions;
create policy "admin: lê todas as redemptions" on public.redemptions
  for select to authenticated using (public.is_admin());

drop policy if exists "admin: lê todo o ledger" on public.points_ledger;
create policy "admin: lê todo o ledger" on public.points_ledger
  for select to authenticated using (public.is_admin());

drop policy if exists "admin: lê todas as rewards" on public.rewards;
create policy "admin: lê todas as rewards" on public.rewards
  for select to authenticated using (public.is_admin());

drop policy if exists "notas: admin lê tudo" on storage.objects;
create policy "notas: admin lê tudo" on storage.objects
  for select to authenticated using (bucket_id = 'notas' and public.is_admin());
