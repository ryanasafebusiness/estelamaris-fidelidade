-- =============================================================================
-- Estelamaris — 14 · Realtime na receipts
-- A tela "Enviar nota" assina UPDATE da própria receipt para sair de
-- "Analisando..." quando o n8n aprova/rejeita. Sem isto, o evento nunca chega.
-- RLS continua valendo na entrega (cada cliente só recebe as próprias notas).
-- =============================================================================
alter publication supabase_realtime add table public.receipts;
