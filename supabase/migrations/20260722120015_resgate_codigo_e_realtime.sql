-- =============================================================================
-- Estelamaris — 15 · Código de resgate EM-XXXXX + Realtime na redemptions
-- Código legível (alfabeto sem O/0/I/1) e realtime para o cliente ver "Usado ✓".
-- =============================================================================
create or replace function public.redeem_reward(p_reward uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user       uuid := (select auth.uid());
  v_custo      integer; v_ativo boolean; v_titulo text; v_saldo integer; v_dias integer;
  v_codigo     text; v_new_saldo integer; v_redemption uuid; v_expira timestamptz;
  v_alfa       text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i            integer;
begin
  if v_user is null then
    raise exception 'Não autenticado.' using errcode = 'P0001';
  end if;

  select custo_pontos, ativo, titulo into v_custo, v_ativo, v_titulo
    from public.rewards where id = p_reward for update;
  if v_custo is null then
    raise exception 'Recompensa não encontrada.' using errcode = 'P0002';
  end if;
  if not v_ativo then
    raise exception 'Recompensa indisponível.' using errcode = 'P0001';
  end if;

  select pontos_saldo into v_saldo from public.profiles where id = v_user for update;
  if v_saldo < v_custo then
    raise exception 'Saldo insuficiente: você tem % ponto(s) e precisa de %.', v_saldo, v_custo
      using errcode = 'P0001';
  end if;

  select dias_expiracao_resgate into v_dias from public.config where id = true;
  v_expira := now() + make_interval(days => v_dias);

  loop
    v_codigo := 'EM-';
    for i in 1..5 loop
      v_codigo := v_codigo || substr(v_alfa, 1 + floor(random() * length(v_alfa))::int, 1);
    end loop;
    exit when not exists (select 1 from public.redemptions where codigo = v_codigo);
  end loop;

  v_new_saldo := v_saldo - v_custo;
  update public.profiles set pontos_saldo = v_new_saldo where id = v_user;

  insert into public.redemptions (user_id, reward_id, codigo, custo_pontos, status, expires_at)
  values (v_user, p_reward, v_codigo, v_custo, 'ativo', v_expira)
  returning id into v_redemption;

  insert into public.points_ledger (user_id, tipo, pontos, saldo_apos, redemption_id, descricao)
  values (v_user, 'debito', -v_custo, v_new_saldo, v_redemption, 'Resgate: ' || v_titulo);

  return jsonb_build_object('codigo', v_codigo, 'custo', v_custo, 'saldo', v_new_saldo,
           'expira_em', v_expira, 'redemption_id', v_redemption);
end;
$$;

revoke all on function public.redeem_reward(uuid) from public, anon;
grant execute on function public.redeem_reward(uuid) to authenticated;

alter publication supabase_realtime add table public.redemptions;
