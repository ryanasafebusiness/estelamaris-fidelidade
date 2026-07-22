-- =============================================================================
-- Estelamaris — 09 · Adiciona 'processando' ao enum receipt_status
-- Usado pelo n8n para "travar" a nota enquanto processa (evita reprocessamento).
-- =============================================================================
alter type public.receipt_status add value if not exists 'processando';
