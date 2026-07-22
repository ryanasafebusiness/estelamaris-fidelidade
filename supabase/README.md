# supabase/

Migrations SQL e configuração do banco do projeto **Estelamaris**.

- `migrations/` — arquivos SQL versionados (schema, RLS, funções `SECURITY DEFINER`,
  tabela `config`, `hash_dedupe`, etc.). Nomeie por timestamp, ex.:
  `20260722__init.sql`.

## Projeto Supabase

- **Nome:** estelamaris
- **Ref:** `xyralczahmkmwlgronmd`
- **URL:** https://xyralczahmkmwlgronmd.supabase.co
- **Região:** us-east-2 · Postgres 17

As migrations serão aplicadas na **Fase 1** (modelo de dados). Regras de segurança:
o cliente nunca escreve pontos; `pontos_saldo`, `pontos_acumulados` e status das notas
só mudam via funções `SECURITY DEFINER` ou pela `service_role` (n8n). Ver `CLAUDE.md`.
