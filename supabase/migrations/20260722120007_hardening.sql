-- =============================================================================
-- Estelamaris — 07 · Hardening (respostas ao security advisor)
-- =============================================================================

-- 1) Fixa search_path das funções utilitárias (evita hijack de search_path).
alter function public.set_updated_at() set search_path = '';
alter function public.estelamaris_nivel(integer, integer, integer) set search_path = '';

-- 2) handle_new_user é função de TRIGGER: ninguém deve poder chamá-la via RPC.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Nota: redeem_reward continua executável por 'authenticated' de propósito
-- (é o cliente que resgata, usando auth.uid()). Advisor marca como WARN esperado.
