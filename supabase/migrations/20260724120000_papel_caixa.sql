-- Adiciona o papel 'caixa' (operador de caixa): acessa só /caixa (validação e
-- baixa de resgates), sem acesso ao restante do /admin. 'admin' continua
-- podendo tudo, inclusive o caixa.
alter table public.profiles
  drop constraint if exists profiles_papel_check;

alter table public.profiles
  add constraint profiles_papel_check
  check (papel in ('cliente', 'admin', 'caixa'));
