-- =============================================================================
-- Estelamaris — 10 · credit_receipt/reject_receipt aceitam 'processando'
-- Como o n8n marca a nota como 'processando' antes de creditar, as funções
-- precisam tratar 'pendente' E 'processando' como estados processáveis.
-- (Corpo completo recriado; só muda a checagem de status.)
-- =============================================================================

create or replace function public.credit_receipt(
  p_receipt uuid, p_valor numeric, p_data date, p_estab text,
  p_cnpj text, p_chave text, p_hash text, p_ai jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid; v_status public.receipt_status;
  v_ppr numeric; v_mb numeric; v_mp numeric; v_mo numeric; v_lp integer; v_lo integer;
  v_acum integer; v_saldo integer; v_nivel text; v_mult numeric; v_pontos integer;
  v_new_acum integer; v_new_saldo integer; v_new_nivel text;
begin
  select user_id, status into v_user, v_status
    from public.receipts where id = p_receipt for update;

  if v_user is null then
    raise exception 'Nota % não encontrada.', p_receipt using errcode = 'P0002';
  end if;

  if v_status not in ('pendente', 'processando') then
    return jsonb_build_object('status', v_status, 'creditado', false,
             'motivo', 'nota não está pendente/processando (idempotência)');
  end if;

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

  select pontos_por_real, mult_bronze, mult_prata, mult_ouro, limite_prata, limite_ouro
    into v_ppr, v_mb, v_mp, v_mo, v_lp, v_lo
    from public.config where id = true;

  select pontos_acumulados, pontos_saldo into v_acum, v_saldo
    from public.profiles where id = v_user for update;

  v_nivel := public.estelamaris_nivel(v_acum, v_lp, v_lo);
  v_mult  := case v_nivel when 'ouro' then v_mo when 'prata' then v_mp else v_mb end;
  v_pontos := floor( floor(p_valor) * v_ppr * v_mult )::integer;

  v_new_acum  := v_acum  + v_pontos;
  v_new_saldo := v_saldo + v_pontos;
  v_new_nivel := public.estelamaris_nivel(v_new_acum, v_lp, v_lo);

  begin
    update public.profiles
       set pontos_saldo = v_new_saldo, pontos_acumulados = v_new_acum, nivel = v_new_nivel
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

create or replace function public.reject_receipt(p_receipt uuid, p_motivo text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_status public.receipt_status;
begin
  update public.receipts
     set status = 'rejeitada',
         motivo_rejeicao = coalesce(nullif(p_motivo, ''), 'rejeitada'),
         processed_at = now()
   where id = p_receipt and status in ('pendente', 'processando')
   returning status into v_status;

  if v_status is null then
    raise exception 'Nota % inexistente ou já finalizada.', p_receipt using errcode = 'P0002';
  end if;

  return jsonb_build_object('status', 'rejeitada', 'receipt', p_receipt);
end;
$$;
