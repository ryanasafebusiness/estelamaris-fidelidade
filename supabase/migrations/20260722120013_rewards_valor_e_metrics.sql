-- =============================================================================
-- Estelamaris — 13 · Valor em R$ das recompensas + métricas do admin
-- rewards.valor_reais = valor do desconto (para custo do programa e comprovante).
-- admin_metrics() calcula todas as KPIs do painel (só admin).
-- =============================================================================

alter table public.rewards
  add column if not exists valor_reais numeric(12,2) not null default 0;

update public.rewards set valor_reais = 5  where titulo = 'R$5 de desconto'  and valor_reais = 0;
update public.rewards set valor_reais = 12 where titulo = 'R$12 de desconto' and valor_reais = 0;
update public.rewards set valor_reais = 30 where titulo = 'R$30 de desconto' and valor_reais = 0;

create or replace function public.admin_metrics()
returns jsonb
language plpgsql security definer set search_path = '' stable as $$
declare v jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao administrador.' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'clientes_total', (select count(*) from public.profiles),
    'clientes_ativos', (select count(distinct user_id) from public.receipts where status = 'aprovada'),
    'notas_aprovadas', (select count(*) from public.receipts where status = 'aprovada'),
    'notas_pendentes', (select count(*) from public.receipts where status = 'pendente'),
    'notas_rejeitadas', (select count(*) from public.receipts where status = 'rejeitada'),
    'notas_hoje', (select count(*) from public.receipts where created_at::date = now()::date),
    'faturamento_total', coalesce((select sum(valor) from public.receipts where status = 'aprovada'), 0),
    'faturamento_mes', coalesce((select sum(valor) from public.receipts where status = 'aprovada' and created_at >= date_trunc('month', now())), 0),
    'ticket_medio', coalesce((select avg(valor) from public.receipts where status = 'aprovada' and valor > 0), 0),
    'pontos_creditados', coalesce((select sum(pontos) from public.points_ledger where tipo = 'credito'), 0),
    'pontos_resgatados', coalesce((select -sum(pontos) from public.points_ledger where tipo = 'debito'), 0),
    'pontos_em_circulacao', coalesce((select sum(pontos_saldo) from public.profiles), 0),
    'resgates_ativos', (select count(*) from public.redemptions where status = 'ativo'),
    'resgates_usados', (select count(*) from public.redemptions where status = 'usado'),
    'custo_descontos', coalesce((
      select sum(rw.valor_reais) from public.redemptions rd
      join public.rewards rw on rw.id = rd.reward_id where rd.status = 'usado'), 0),
    'custo_descontos_pendente', coalesce((
      select sum(rw.valor_reais) from public.redemptions rd
      join public.rewards rw on rw.id = rd.reward_id where rd.status = 'ativo'), 0),
    'notas_por_dia', (
      select coalesce(jsonb_agg(jsonb_build_object('dia', d, 'count', c) order by d), '[]'::jsonb)
      from (
        select gs::date as d,
               (select count(*) from public.receipts r where r.created_at::date = gs::date) as c
        from generate_series(now()::date - interval '6 days', now()::date, interval '1 day') gs
      ) x
    )
  ) into v;
  return v;
end;
$$;

revoke all on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;
