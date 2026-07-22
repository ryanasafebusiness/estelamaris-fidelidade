-- =============================================================================
-- Estelamaris — 08 · Auth/profile
-- 1) handle_new_user passa a popular nome/cpf/telefone a partir do metadata do
--    cadastro (raw_user_meta_data). 2) cpf_disponivel() para pré-checagem amigável.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nome, cpf, telefone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'cpf', ''),
    nullif(new.raw_user_meta_data ->> 'telefone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
-- (EXECUTE já revogado na migration 07; create or replace preserva privilégios.)

-- Pré-checagem de CPF no cadastro (pré-auth). SECURITY DEFINER para enxergar
-- todos os perfis, mas retorna apenas booleano (disponível ou não).
-- NOTA: permite enumeração de CPF por anon — aceitável no MVP; endurecer depois
-- com captcha/rate-limit se necessário.
create or replace function public.cpf_disponivel(p_cpf text)
returns boolean
language sql security definer set search_path = '' stable as $$
  select not exists (select 1 from public.profiles where cpf = p_cpf);
$$;

revoke all on function public.cpf_disponivel(text) from public;
grant execute on function public.cpf_disponivel(text) to anon, authenticated;
