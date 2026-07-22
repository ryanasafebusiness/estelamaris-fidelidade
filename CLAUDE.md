# CLAUDE.md — Estelamaris (Sistema de Fidelidade da Farmácia)

> Documento de contexto do projeto. **Consultar sempre antes de escrever ou alterar código.**
> Nome do sistema: **Estelamaris**.
> Idioma da interface: **Português do Brasil**. Moeda: **BRL (R$)**.

---

## 1. Produto

- App web **mobile-first** onde o **CLIENTE** tira foto da **nota fiscal (cupom)** da compra.
- Uma **IA (Claude, via API Anthropic)** lê o **valor da nota**. O sistema **credita pontos**.
- O cliente **troca pontos** por descontos/brindes.
- **Single-tenant**: é uma farmácia só.

---

## 2. Stack

| Camada            | Tecnologia                                                        |
|-------------------|-------------------------------------------------------------------|
| Frontend          | Next.js (App Router) + TypeScript + Tailwind                      |
| Hospedagem front  | Vercel                                                            |
| Backend de dados  | Supabase (Postgres, Auth, Storage, Realtime, RPC)                |
| Automação / IA    | n8n — **é o n8n quem chama a API da Anthropic e credita os pontos** |

---

## 3. Regras de segurança (INEGOCIÁVEIS)

1. **O cliente NUNCA escreve pontos.** RLS deixa o usuário apenas **LER/gravar os próprios dados não-sensíveis**.
2. `pontos_saldo`, `pontos_acumulados` e o **status das notas** só mudam via:
   - funções no banco (**SECURITY DEFINER**), ou
   - a **service_role** usada pelo n8n.
   - **Nunca pelo client.**
3. A **service_role key** só existe **no n8n e em rotas de servidor**. **Nunca** no client nem no repositório.
4. **Toda nota tem `hash_dedupe` único** para impedir crédito duplicado da mesma nota.

---

## 4. Regras de pontos (ficam numa tabela `config`, editável)

- **1 ponto por R$ 1,00 gasto** — arredonda **para baixo** o valor antes de multiplicar.
- **Multiplicador por nível:**
  | Nível  | Multiplicador | A partir de (pontos acumulados) |
  |--------|---------------|---------------------------------|
  | Bronze | 1,0x          | 0                               |
  | Prata  | 1,2x          | 500                             |
  | Ouro   | 1,5x          | 2000                            |
- **Nível é calculado por `pontos_acumulados` (vitalício)**, não pelo saldo atual.

### Exemplo de cálculo
Compra de R$ 137,80, cliente Prata:
`floor(137,80) = 137` → `137 × 1,2 = 164,4` → **floor final = 164 pontos**.

> **Decisão (Fase 1):** o resultado final também é arredondado **para baixo** (`floor`),
> previsível e sempre a favor da casa. Implementado em `credit_receipt`.
> **Débito de resgate afeta só `pontos_saldo`; `pontos_acumulados` é vitalício** (nível nunca cai).
> Código de resgate: 8 caracteres hex maiúsculos, único (`redemptions.codigo`).

---

## 5. Identidade visual

- **Nome exibido:** Estelamaris.
- **Paleta atual (implementada no tema):** **verde de farmácia (primária) · dourado (pontos) · menta (fundo)**.
  | Papel                         | Token CSS / Tailwind         | Hex base (ajustar depois) |
  |-------------------------------|------------------------------|---------------------------|
  | Verde farmácia — primária     | `--primary` / `bg-primary`   | `#16A34A`                 |
  | Dourado — pontos/recompensas  | `--points` / `text-points`   | `#D4AF37`                 |
  | Menta — fundo                 | `--background`               | `#F2FBF6`                 |
  | Menta clara — secundária      | `--secondary`                | `#D1FAE5`                 |
  | Verde-escuro — texto          | `--foreground`               | `#0F2E1D`                 |
- Todas as cores são **variáveis CSS** em `src/app/globals.css` (Tailwind v4 `@theme`), fáceis de ajustar.
- Tema claro por padrão (contexto de farmácia: limpo, confiável).

> ⚠️ **Divergência a resolver:** numa conversa inicial a identidade citada foi **vermelho/azul/branco**;
> depois foi pedido explicitamente **verde/dourado/menta** para o tema (implementado). Confirmar qual é a
> paleta definitiva e/ou os hex exatos do logo. Trocar é só editar as variáveis em `globals.css`.

---

## 6. Convenções

- Nomes de tabelas/colunas e textos de domínio em **português**.
- Nada de segredos no repositório (`.env*` fora do git, exceto `.env.example` sem valores).
- Todo crédito de pontos é **idempotente** via `hash_dedupe`.

### Estrutura do repositório
```
/                       Next.js 16 (App Router) + TS + Tailwind v4 + ESLint
├─ src/
│  ├─ app/              rotas (App Router), globals.css (tema)
│  └─ lib/supabase/
│     ├─ client.ts      client browser (anon key) — sujeito a RLS
│     ├─ server.ts      client server (anon + cookies) — sujeito a RLS
│     └─ admin.ts       client service_role (server-only) — IGNORA RLS
├─ supabase/
│  ├─ migrations/       SQL versionado (schema, RLS, funções SECURITY DEFINER)
│  └─ README.md
├─ n8n/                 workflow(s) exportado(s) do n8n (JSON)
├─ .env.example         modelo de variáveis (sem valores) — versionado
└─ CLAUDE.md            este arquivo
```
- Projeto Supabase: `estelamaris` (ref `xyralczahmkmwlgronmd`, us-east-2, PG17).

---

## 7. Fases do projeto

- [ ] **Fase 0 — Fundação & contexto** — este CLAUDE.md, decisões de arredondamento, definição do `hash_dedupe`.
- [x] **Fase 1 — Modelo de dados (Supabase)** — migrations em `supabase/migrations/` (schema, RLS, funções SECURITY DEFINER, trigger de auth, storage, seeds, hardening). **Aplicadas no projeto `xyralczahmkmwlgronmd` via MCP.** Advisor limpo (só o WARN esperado de `redeem_reward`).
- [ ] **Fase 2 — Auth & fluxo do cliente** — cadastro/login, perfil, saldo/nível.
- [ ] **Fase 3 — Upload da nota (Storage)** — captura de foto mobile, upload seguro, registro pendente.
- [ ] **Fase 4 — Pipeline n8n + Claude** — OCR/leitura do valor, dedupe, crédito via service_role.
- [ ] **Fase 5 — Frontend cliente (Next.js)** — telas de saldo, histórico, envio de nota, resgate.
- [ ] **Fase 6 — Catálogo de recompensas & resgate** — troca de pontos, débito seguro.
- [ ] **Fase 7 — Admin & observabilidade** — moderação de notas, ajustes, logs.
- [ ] **Fase 8 — Testes, segurança & deploy** — RLS tests, deploy Vercel, hardening.

_Última atualização: 2026-07-22._
