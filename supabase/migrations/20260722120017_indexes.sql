-- Criação de índices (B-Tree) para otimizar as buscas frequentes

-- Histórico de pontos (points_ledger) é filtrado por user_id e ordenado por created_at
create index if not exists points_ledger_user_id_created_at_idx 
on public.points_ledger (user_id, created_at desc);

-- Também é filtrado por user_id e tipo para calcular pontos no mês
create index if not exists points_ledger_user_id_tipo_created_at_idx 
on public.points_ledger (user_id, tipo, created_at);

-- Recibos são filtrados por user_id (meus envios) e ordernados por created_at
create index if not exists receipts_user_id_created_at_idx 
on public.receipts (user_id, created_at desc);

-- Vouchers (QR Codes) são sempre buscados pelo código único
create index if not exists point_vouchers_codigo_idx 
on public.point_vouchers (codigo);
