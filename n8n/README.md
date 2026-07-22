# n8n/

Workflow(s) do **n8n** exportados (JSON) para versionamento.

O n8n é o responsável por:
1. Receber a nota enviada pelo app (webhook).
2. Chamar a **API da Anthropic (Claude)** para ler o valor da nota fiscal.
3. Calcular pontos (regras da tabela `config`) e **creditar** via `service_role`
   / função `SECURITY DEFINER`, respeitando o `hash_dedupe` (anti-duplicação).

## Convenções
- Exporte o workflow como `estelamaris-credito-nota.json` (ou similar).
- **NUNCA** commite credenciais. As credenciais do n8n (service_role, ANTHROPIC_API_KEY)
  ficam na configuração do próprio n8n, fora deste repositório.

Será construído na **Fase 4**. Ver `CLAUDE.md`.
