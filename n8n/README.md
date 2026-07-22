# n8n/

Workflow(s) do **n8n** exportados (JSON) para versionamento.

## `estelamaris-processa-nota.json`
Processa cada nova `receipt` (gatilho = **Supabase Database Webhook** no INSERT de `receipts`).

**Fluxo:** Webhook → confere segredo (`x-webhook-secret` == `$env.N8N_WEBHOOK_SECRET`) →
marca `processando` → signed URL do Storage → baixa imagem → monta mensagem →
**Claude (visão)** extrai o valor → parse + validações (cupom? valor>0? dentro do prazo?) →
`credit_receipt` (RPC) **ou** `reject_receipt`. Erro em qualquer passo → `reject_receipt` genérico.

- **Instância:** `https://n8n-production-a73f.up.railway.app` · workflow `0o4VY1h10iqks9TR`
- **Webhook (produção):** `POST https://n8n-production-a73f.up.railway.app/webhook/estelamaris-nota`
- **Dedupe:** `chave:<44 dígitos>` se houver chave de acesso, senão `dados:<cnpj>|<valor>|<data>`.

### Credenciais (criar no n8n, NÃO commitar)
- **Supabase service_role** — credencial tipo `supabaseApi` (host = URL do projeto, service_role key).
  Usada em: Marca processando, Gera signed URL, Credita, Rejeita (x3).
- **Anthropic** — credencial tipo `Header Auth` (`httpHeaderAuth`): Name = `x-api-key`, Value = a API key.
  Usada em: Claude - extrai valor.

### Variáveis de ambiente do n8n
- `N8N_WEBHOOK_SECRET` (obrigatória) — segredo do header do webhook.
- `SUPABASE_URL` e `ANTHROPIC_MODEL` (opcionais) — têm fallback no nó **Prepara dados**.

### Parâmetros editáveis (nó "Prepara dados")
`janela_dias` (90), `verificar_cnpj` (false), `cnpj_farmacia` ("").

Ver `CLAUDE.md` (Fase 4) para o passo a passo de configuração e do Database Webhook.
