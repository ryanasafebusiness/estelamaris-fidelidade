-- =============================================================================
-- Estelamaris — 03 · Funções (SECURITY DEFINER) + triggers utilitários
-- Regra: pontos/status/saldo só mudam AQUI (owner ignora RLS) ou via service_role.
-- Todas com search_path='' e objetos qualificados (proteção contra hijack).
-- =============================================================================

-- ---------- updated_at automático --------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_config_updated_at
  before update on public.config
  for each row execute function public.set_updated_at();

-- ---------- helper: nível pelo acumulado -------------------------------------
create or replace function public.estelamaris_nivel(
  p_acumulado integer, p_limite_prata integer, p_limite_ouro integer
) returns text language sql immutable as $$
  select case
           when p_acumulado >= p_limite_ouro  then 'ouro'
           when p_acumulado >= p_limite_prata then 'prata'
           else 'bronze'
         end;
$$;

-- =============================================================================
-- 1) credit_receipt — credita uma nota. SOMENTE service_role (n8n).
-- =============================================================================
create or replace function public.credit_receipt(
  p_receipt uuid,
  p_valor   numeric,
  p_data    date,
  p_estab   text,
  p_cnpj    text,
  p_chave   text,
  p_hash    text,
  p_ai      jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user       uuid;
  v_status     public.receipt_status;
  v_ppr        numeric;
  v_mb         numeric;
  v_mp         numeric;
  v_mo         numeric;
  v_lp         integer;
  v_lo         integer;
  v_acum       integer;
  v_saldo      integer;
  v_nivel      text;
  v_mult       numeric;
  v_pontos     integer;
  v_new_acum   integer;
  v_new_saldo  integer;
  v_new_nivel  text;
begin
  -- Trava a nota e valida
  select user_id, status into v_user, v_status
    from public.receipts where id = p_receipt for update;

  if v_user is null then
    raise exception 'Nota % não encontrada.', p_receipt using errcode = 'P0002';
  end if;

  if v_status <> 'pendente' then
    return jsonb_build_object('status', v_status, 'creditado', false,
             'motivo', 'nota não está pendente (idempotência)');
  end if;

  -- Dedupe explícito (mensagem limpa antes de calcular)
  if p_hash is not null and exists (
       select 1 from public.receipts where hash_dedupe = p_hash and id <> p_receipt
     ) then
    update public.receipts
       set status = 'rejeitada', motivo_rejeicao = 'nota já cadastrada',
           valor = p_valor, data_compra = p_data, estabelecimento = p_estab,
           cnpj = p_cnpj, chave_acesso = p_chave, ai_result = p_ai, processed_at = now()
     where id = p_receipt;
    return jsonb_build_object('status', 'rejeitada', 'creditado', false,
             'motivo', 'nota já cadastrada');
  end if;

  -- Config + perfil (trava o perfil)
  select pontos_por_real, mult_bronze, mult_prata, mult_ouro, limite_prata, limite_ouro
    into v_ppr, v_mb, v_mp, v_mo, v_lp, v_lo
    from public.config where id = true;

  select pontos_acumulados, pontos_saldo into v_acum, v_saldo
    from public.profiles where id = v_user for update;

  -- Nível pelo ACUMULADO (vitalício) e multiplicador
  v_nivel := public.estelamaris_nivel(v_acum, v_lp, v_lo);
  v_mult  := case v_nivel when 'ouro' then v_mo when 'prata' then v_mp else v_mb end;

  -- pontos = floor(valor) * pontos_por_real * multiplicador  (floor final)
  v_pontos := floor( floor(p_valor) * v_ppr * v_mult )::integer;

  v_new_acum  := v_acum  + v_pontos;
  v_new_saldo := v_saldo + v_pontos;
  v_new_nivel := public.estelamaris_nivel(v_new_acum, v_lp, v_lo);

  -- Escreve tudo. Se a corrida bater no índice único de hash => rejeita sem creditar.
  begin
    update public.profiles
       set pontos_saldo = v_new_saldo,
           pontos_acumulados = v_new_acum,
           nivel = v_new_nivel
     where id = v_user;

    update public.receipts
       set status = 'aprovada', valor = p_valor, data_compra = p_data,
           estabelecimento = p_estab, cnpj = p_cnpj, chave_acesso = p_chave,
           hash_dedupe = p_hash, ai_result = p_ai, pontos_gerados = v_pontos,
           motivo_rejeicao = null, processed_at = now()
     where id = p_receipt;

    insert into public.points_ledger (user_id, tipo, pontos, saldo_apos, receipt_id, descricao)
    values (v_user, 'credito', v_pontos, v_new_saldo, p_receipt,
            'Crédito de nota' || coalesce(' - ' || p_estab, ''));
  exception when unique_violation then
    update public.receipts
       set status = 'rejeitada', motivo_rejeicao = 'nota já cadastrada',
           ai_result = p_ai, processed_at = now()
     where id = p_receipt;
    return jsonb_build_object('status', 'rejeitada', 'creditado', false,
             'motivo', 'nota já cadastrada (corrida)');
  end;

  return jsonb_build_object('status', 'aprovada', 'creditado', true,
           'pontos', v_pontos, 'nivel', v_new_nivel, 'saldo', v_new_saldo);
end;
$$;

revoke all on function public.credit_receipt(uuid,numeric,date,text,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.credit_receipt(uuid,numeric,date,text,text,text,text,jsonb)
  to service_role;

-- =============================================================================
-- 2) reject_receipt — rejeita nota pendente. SOMENTE service_role.
-- =============================================================================
create or replace function public.reject_receipt(p_receipt uuid, p_motivo text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_status public.receipt_status;
begin
  update public.receipts
     set status = 'rejeitada',
         motivo_rejeicao = coalesce(nullif(p_motivo, ''), 'rejeitada'),
         processed_at = now()
   where id = p_receipt and status = 'pendente'
   returning status into v_status;

  if v_status is null then
    raise exception 'Nota % inexistente ou não está pendente.', p_receipt using errcode = 'P0002';
  end if;

  return jsonb_build_object('status', 'rejeitada', 'receipt', p_receipt);
end;
$$;

revoke all on function public.reject_receipt(uuid, text) from public, anon, authenticated;
grant execute on function public.reject_receipt(uuid, text) to service_role;

-- =============================================================================
-- 3) redeem_reward — resgate pelo cliente (auth.uid()). Débito + código único.
-- =============================================================================
create or replace function public.redeem_reward(p_reward uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user       uuid := (select auth.uid());
  v_custo      integer;
  v_ativo      boolean;
  v_titulo     text;
  v_saldo      integer;
  v_dias       integer;
  v_codigo     text;
  v_new_saldo  integer;
  v_redemption uuid;
  v_expira     timestamptz;
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

  -- Código curto único (8 hex maiúsculos)
  loop
    v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.redemptions where codigo = v_codigo);
  end loop;

  v_new_saldo := v_saldo - v_custo;

  -- Débito só no SALDO. pontos_acumulados é vitalício => NÃO muda (nível intacto).
  update public.profiles set pontos_saldo = v_new_saldo where id = v_user;

  insert into public.redemptions (user_id, reward_id, codigo, custo_pontos, status, expires_at)
  values (v_user, p_reward, v_codigo, v_custo, 'ativo', v_expira)
  returning id into v_redemption;

  insert into public.points_ledger (user_id, tipo, pontos, saldo_apos, redemption_id, descricao)
  values (v_user, 'debito', -v_custo, v_new_saldo, v_redemption, 'Resgate: ' || v_titulo);

  return jsonb_build_object('codigo', v_codigo, 'custo', v_custo,
           'saldo', v_new_saldo, 'expira_em', v_expira);
end;
$$;

revoke all on function public.redeem_reward(uuid) from public, anon;
grant execute on function public.redeem_reward(uuid) to authenticated;
