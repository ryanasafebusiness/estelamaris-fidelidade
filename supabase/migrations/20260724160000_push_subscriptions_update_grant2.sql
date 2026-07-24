-- =============================================================================
-- Estelamaris — 21 · Corrige grant de UPDATE em push_subscriptions (2)
-- O upsert do PostgREST inclui user_id/endpoint no SET (mesmo repetindo o
-- mesmo valor, por serem as colunas do on_conflict) — faltava UPDATE nelas.
-- =============================================================================
grant update (user_id, endpoint) on public.push_subscriptions to authenticated;
