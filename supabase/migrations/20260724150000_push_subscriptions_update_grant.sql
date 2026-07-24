-- =============================================================================
-- Estelamaris — 20 · Corrige grant de UPDATE em push_subscriptions
-- O upsert (on_conflict user_id,endpoint) reescreve p256dh/auth_key/user_agent
-- também, não só "ativo" — faltava o grant dessas colunas, causando
-- "permission denied for table push_subscriptions" ao reassinar.
-- =============================================================================
grant update (p256dh, auth_key, user_agent, ativo) on public.push_subscriptions to authenticated;
