# n8n/

Workflow(s) do **n8n** exportados (JSON) para versionamento.

## `estelamaris-processa-nota.json`
Processa cada nova `receipt` (gatilho = **Supabase Database Webhook** no INSERT de `receipts`).

**Fluxo:** Webhook (endpoint público, sem segredo no header) → marca `processando` →
signed URL do Storage → baixa imagem → monta mensagem → **Groq (visão, Qwen 3.6 27B)**
extrai os dados → parse + validações (cupom? valor>0? dentro do prazo? **é da Estelamaris?**) →
`credit_receipt` (RPC) **ou** `reject_receipt`. Erro em qualquer passo → `reject_receipt` genérico.

- **Instância:** `https://n8n-production-a73f.up.railway.app` · workflow `0o4VY1h10iqks9TR` · **ativo**
- **Webhook (produção):** `POST https://n8n-production-a73f.up.railway.app/webhook/estelamaris-nota`
- **IA:** Groq (API compatível com OpenAI), `qwen/qwen3.6-27b` — é um modelo "thinking": responde
  com um bloco `<think>...</think>` antes do JSON final. O nó **Parse + validacoes** remove esse
  bloco antes de fazer `JSON.parse`. `max_tokens: 1500` (o raciocínio consome tokens antes do JSON).
- **Verificação de farmácia (sempre ativa):** só credita nota cujo CNPJ seja `21.135.884/0001-61`
  **OU** cujo nome do estabelecimento contenha `ESTELAMARIS` (comparação sem acento/maiúsculas).
  Notas de outros estabelecimentos são rejeitadas com o motivo "nota nao e da Estelamaris".
- **Dedupe:** `chave:<44 dígitos>` se houver chave de acesso, senão `dados:<cnpj>|<valor>|<data>`.

### Credenciais (no n8n)
- **Supabase service_role** — credencial `supabaseApi` chamada **"Farmacia"**. Host = URL do
  projeto, Service Role Secret = a service_role key. Usada em: Marca processando, Gera signed URL,
  Credita, Rejeita (x2).
- **Groq** — credencial `groqApi` chamada **"Groq account"**. Usada no nó **Groq - extrai valor**
  (a credencial injeta `Authorization: Bearer` automaticamente).

### Sem segredo de webhook
O endpoint do webhook é público (não exige header secreto) — protegido apenas por ser um path
gerado (`estelamaris-nota`) e por não expor nenhuma operação sensível diretamente (quem processa
os dados é sempre o `credit_receipt`/`reject_receipt`, que validam tudo no servidor).

### Parâmetros editáveis (nó "Prepara dados")
`supabase_url`, `modelo_ia` (`qwen/qwen3.6-27b`), `janela_dias` (90), `verificar_farmacia` (true),
`cnpj_farmacia` (`21135884000161`), `nome_farmacia` (`ESTELAMARIS`).

### Testado ponta a ponta (22/07/2026)
- Nota real da Estelamaris (CNPJ 21.135.884/0001-61, R$ 45,90) → **aprovada**, 45 pontos creditados.
- Nota simulada de outra farmácia → **rejeitada** ("nota nao e da Estelamaris"), 0 pontos.
- Imagem inválida/em branco → **rejeitada** ("imagem nao parece um cupom fiscal").

Ver `CLAUDE.md` (Fase 4) para mais contexto.
