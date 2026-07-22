# n8n/

Workflow(s) do **n8n** exportados (JSON) para versionamento.

## `estelamaris-processa-nota.json`
Processa cada nova `receipt` (gatilho = **Supabase Database Webhook** no INSERT de `receipts`).

**Fluxo:** Webhook → confere segredo (`x-webhook-secret` == `$env.N8N_WEBHOOK_SECRET`) →
marca `processando` → signed URL do Storage → baixa imagem → monta mensagem →
**Groq (visão, Llama 4 Scout)** extrai o valor → parse + validações (cupom? valor>0? dentro do prazo?) →
`credit_receipt` (RPC) **ou** `reject_receipt`. Erro em qualquer passo → `reject_receipt` genérico.

- **Instância:** `https://n8n-production-a73f.up.railway.app` · workflow `0o4VY1h10iqks9TR`
- **Webhook (produção):** `POST https://n8n-production-a73f.up.railway.app/webhook/estelamaris-nota`
- **IA:** Groq (API compatível com OpenAI), modelo de visão configurável no nó **Prepara dados**
  (`modelo_ia`, padrão `meta-llama/llama-4-scout-17b-16e-instruct`). Alternativas: `meta-llama/llama-4-maverick-17b-128e-instruct`, `qwen/qwen3.6-27b`.
- **Dedupe:** `chave:<44 dígitos>` se houver chave de acesso, senão `dados:<cnpj>|<valor>|<data>`.

### Credenciais (no n8n)
- **Supabase service_role** — credencial `supabaseApi` (host = URL do projeto, service_role key).
  Usada em: Marca processando, Gera signed URL, Credita, Rejeita (x3).
- **Groq** — credencial `groqApi` (a "Groq account" já existente no n8n). Usada no nó **Groq - extrai valor**.
  (A API do Groq é OpenAI-compatível: `Authorization: Bearer <key>` — injetado pela credencial.)

### Variáveis de ambiente do n8n
- `N8N_WEBHOOK_SECRET` (obrigatória) — segredo do header do webhook.

### Parâmetros editáveis (nó "Prepara dados")
`supabase_url`, `modelo_ia`, `janela_dias` (90), `verificar_cnpj` (false), `cnpj_farmacia` ("").

Ver `CLAUDE.md` (Fase 4) para o passo a passo de configuração e do Database Webhook.
