-- =============================================================================
-- Estelamaris — 23 · Ajuste manual de pontos (admin)
-- Hoje corrigir o saldo de um cliente (nota mal creditada, erro de sistema)
-- só dava pra fazer com UPDATE direto no banco. Esta função dá um jeito
-- seguro e auditável (vira uma linha normal no points_ledger, visível na
-- aba Extrato do cliente em /admin/clientes).
-- =============================================================================
create or replace function public.admin_adjust_points(p_user uuid, p_pontos integer, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_saldo      integer;
  v_acum       integer;
  v_lp         integer;
  v_lo         integer;
  v_new_saldo  integer;
  v_new_acum   integer;
  v_new_nivel  text;
begin
  if p_pontos = 0 then
    raise exception 'Informe uma quantidade de pontos diferente de zero.' using errcode = 'P0001';
  end if;

  select limite_prata, limite_ouro into v_lp, v_lo from public.config where id = true;

  select pontos_saldo, pontos_acumulados into v_saldo, v_acum
    from public.profiles where id = p_user for update;

  if v_saldo is null then
    raise exception 'Cliente não encontrado.' using errcode = 'P0002';
  end if;

  -- Saldo pode subir ou descer (com piso em 0). pontos_acumulados/nível só
  -- sobem — mesma regra já usada no débito de resgate: nível nunca cai.
  v_new_saldo := greatest(v_saldo + p_pontos, 0);
  v_new_acum  := v_acum;
  if p_pontos > 0 then
    v_new_acum := v_acum + p_pontos;
  end if;
  v_new_nivel := public.estelamaris_nivel(v_new_acum, v_lp, v_lo);

  update public.profiles
     set pontos_saldo = v_new_saldo, pontos_acumulados = v_new_acum, nivel = v_new_nivel
   where id = p_user;

  insert into public.points_ledger (user_id, tipo, pontos, saldo_apos, descricao)
  values (p_user, case when p_pontos > 0 then 'credito' else 'debito' end, p_pontos, v_new_saldo,
          'Ajuste manual (admin): ' || coalesce(nullif(trim(p_motivo), ''), 'sem motivo informado'));

  return jsonb_build_object('novo_saldo', v_new_saldo, 'novo_acumulado', v_new_acum, 'novo_nivel', v_new_nivel);
end;
$fn$;

revoke all on function public.admin_adjust_points(uuid, integer, text) from public, anon, authenticated;
