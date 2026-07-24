-- =============================================================================
-- Estelamaris — 19 · Database Webhooks para notificações push
-- Mesmo padrão da migration 11 (pg_net -> n8n): dispara no evento de negócio,
-- o n8n é quem decide o texto da notificação e chama /api/push/send.
-- Endpoint protegido só pelo path aleatório (mesma decisão já tomada pro
-- webhook de notas — ver CLAUDE.md).
-- =============================================================================

-- ---------- receipts: status virou aprovada/rejeitada ------------------------
create or replace function public.estelamaris_notify_nota_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if old.status is distinct from new.status and new.status in ('aprovada', 'rejeitada') then
    perform net.http_post(
      url := 'https://n8n-production-a73f.up.railway.app/webhook/estelamaris-push-c7f9df3a',
      body := jsonb_build_object(
        'evento', case when new.status = 'aprovada' then 'nota_aprovada' else 'nota_rejeitada' end,
        'record', to_jsonb(new)
      ),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 5000
    );
  end if;
  return new;
end;
$fn$;

revoke all on function public.estelamaris_notify_nota_status() from public, anon, authenticated;

drop trigger if exists estelamaris_receipt_status_changed on public.receipts;
create trigger estelamaris_receipt_status_changed
  after update on public.receipts
  for each row execute function public.estelamaris_notify_nota_status();

-- ---------- redemptions: resgate criado ---------------------------------------
create or replace function public.estelamaris_notify_resgate_criado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_reward jsonb;
begin
  select jsonb_build_object('titulo', titulo, 'valor_reais', valor_reais)
    into v_reward from public.rewards where id = new.reward_id;

  perform net.http_post(
    url := 'https://n8n-production-a73f.up.railway.app/webhook/estelamaris-push-c7f9df3a',
    body := jsonb_build_object('evento', 'resgate_criado', 'record', to_jsonb(new), 'reward', v_reward),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 5000
  );
  return new;
end;
$fn$;

revoke all on function public.estelamaris_notify_resgate_criado() from public, anon, authenticated;

drop trigger if exists estelamaris_redemption_inserted_push on public.redemptions;
create trigger estelamaris_redemption_inserted_push
  after insert on public.redemptions
  for each row execute function public.estelamaris_notify_resgate_criado();
