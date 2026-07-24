-- =============================================================================
-- Estelamaris — 25 · Auth/profile: Google Name Fix
-- Atualiza o handle_new_user para capturar o full_name ou name do Google
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nome, cpf, telefone)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''), 
      nullif(new.raw_user_meta_data ->> 'name', ''), 
      nullif(new.raw_user_meta_data ->> 'nome', '')
    ),
    nullif(new.raw_user_meta_data ->> 'cpf', ''),
    nullif(new.raw_user_meta_data ->> 'telefone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
