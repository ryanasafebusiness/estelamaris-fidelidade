-- =============================================================================
-- Estelamaris — 22 · Auto-expira resgates vencidos + devolve pontos
-- Nada escrevia 'expirado' no status — ficava 'ativo' pra sempre e o cliente
-- nunca recebia os pontos de volta. Um job (pg_cron) roda a cada 15min e
-- fecha isso: marca expirado e devolve os pontos gastos ao pontos_saldo
-- (pontos_acumulados/nivel NÃO mudam — mesma regra de "nível nunca cai" já
-- usada no débito do resgate).
-- =============================================================================
create extension if not exists pg_cron;

create or replace function public.expirar_resgates_vencidos()
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  r record;
  v_novo_saldo integer;
begin
  for r in
    select id, user_id, custo_pontos, codigo
    from public.redemptions
    where status = 'ativo' and expires_at is not null and expires_at < now()
    for update skip locked
  loop
    update public.redemptions set status = 'expirado' where id = r.id;

    update public.profiles
      set pontos_saldo = pontos_saldo + r.custo_pontos
      where id = r.user_id
      returning pontos_saldo into v_novo_saldo;

    insert into public.points_ledger (user_id, tipo, pontos, saldo_apos, redemption_id, descricao)
    values (r.user_id, 'credito', r.custo_pontos, v_novo_saldo, r.id,
            'Devolução: resgate expirado (' || r.codigo || ')');
  end loop;
end;
$fn$;

revoke all on function public.expirar_resgates_vencidos() from public, anon, authenticated;

select cron.schedule(
  'estelamaris-expirar-resgates',
  '*/15 * * * *',
  $$select public.expirar_resgates_vencidos();$$
);
