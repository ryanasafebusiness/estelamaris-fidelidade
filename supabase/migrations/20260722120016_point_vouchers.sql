create table public.point_vouchers (
    id uuid default gen_random_uuid() primary key,
    codigo text not null unique,
    pontos integer not null check (pontos > 0),
    status text not null default 'ativo' check (status in ('ativo', 'usado', 'cancelado')),
    used_by uuid references public.profiles(id),
    used_at timestamp with time zone,
    created_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.point_vouchers enable row level security;

-- Apenas admins podem ler todos e inserir
create policy "Admins podem gerenciar vouchers" on public.point_vouchers
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and papel = 'admin'
    )
  );

-- Usuarios comuns podem ler apenas vouchers publicos (para ver detalhes antes de resgatar se necessario)
-- Mas na real, o ideal é que só a function RPC veja. Vamos deixar o public select livre pelo codigo, ou só autenticados.
create policy "Usuarios autenticados podem ler vouchers" on public.point_vouchers
  for select using (auth.role() = 'authenticated');

-- RPC para resgatar voucher
create or replace function public.redeem_point_voucher(p_codigo text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_voucher record;
  v_user_id uuid;
begin
  -- Pega o usuario autenticado
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  -- Busca o voucher travando a linha (para evitar resgate duplo concorrente)
  select * into v_voucher
  from public.point_vouchers
  where codigo = p_codigo
  for update;

  if not found then
    raise exception 'Voucher não encontrado';
  end if;

  if v_voucher.status != 'ativo' then
    raise exception 'Voucher já foi utilizado ou está cancelado';
  end if;

  -- Marca como usado
  update public.point_vouchers
  set status = 'usado',
      used_by = v_user_id,
      used_at = now()
  where id = v_voucher.id;

  -- Adiciona os pontos ao usuario
  update public.profiles
  set pontos_saldo = pontos_saldo + v_voucher.pontos,
      pontos_acumulados = pontos_acumulados + v_voucher.pontos
  where id = v_user_id;

  -- Registra no historico
  insert into public.points_ledger (user_id, tipo, pontos, descricao)
  values (v_user_id, 'credito', v_voucher.pontos, 'Cupom na loja');

  return true;
end;
$$;

revoke all on function public.redeem_point_voucher(text) from public, anon;
grant execute on function public.redeem_point_voucher(text) to authenticated;
