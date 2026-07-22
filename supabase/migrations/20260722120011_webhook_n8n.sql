-- =============================================================================
-- Estelamaris — 11 · Database Webhook (INSERT em receipts -> n8n)
-- Usa pg_net para POST no webhook do n8n com o header secreto.
--
-- ⚠️ SEGREDO: o valor real de x-webhook-secret NÃO fica no repo. Foi aplicado
--    diretamente no banco via MCP (execute_sql). Este arquivo documenta o schema
--    com um placeholder — troque __N8N_WEBHOOK_SECRET__ pelo valor real (o mesmo
--    configurado em N8N_WEBHOOK_SECRET no n8n) se for reaplicar por CLI.
-- =============================================================================
create extension if not exists pg_net;

create or replace function public.estelamaris_notify_n8n()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  perform net.http_post(
    url := 'https://n8n-production-a73f.up.railway.app/webhook/estelamaris-nota',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'receipts',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', null
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '__N8N_WEBHOOK_SECRET__'
    ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$fn$;

drop trigger if exists estelamaris_receipt_inserted on public.receipts;
create trigger estelamaris_receipt_inserted
  after insert on public.receipts
  for each row execute function public.estelamaris_notify_n8n();
