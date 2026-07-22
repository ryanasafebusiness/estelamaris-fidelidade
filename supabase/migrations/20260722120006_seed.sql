-- =============================================================================
-- Estelamaris — 06 · Seeds
-- config (valores do CLAUDE.md) + rewards de exemplo. Idempotente.
-- =============================================================================

-- Linha única de configuração (regras de pontos).
insert into public.config
  (id, pontos_por_real, mult_bronze, mult_prata, mult_ouro,
   limite_prata, limite_ouro, dias_expiracao_resgate)
values
  (true, 1, 1.0, 1.2, 1.5, 500, 2000, 30)
on conflict (id) do nothing;

-- Recompensas de exemplo (só insere se ainda não existir o título).
insert into public.rewards (titulo, descricao, custo_pontos, ativo)
select v.titulo, v.descricao, v.custo_pontos, true
from (values
  ('R$5 de desconto',   'R$ 5,00 de desconto na próxima compra.',   100),
  ('R$12 de desconto',  'R$ 12,00 de desconto na próxima compra.',  200),
  ('R$30 de desconto',  'R$ 30,00 de desconto na próxima compra.',  450),
  ('Necessaire brinde', 'Necessaire exclusiva Estelamaris.',        700)
) as v(titulo, descricao, custo_pontos)
where not exists (
  select 1 from public.rewards r where r.titulo = v.titulo
);
