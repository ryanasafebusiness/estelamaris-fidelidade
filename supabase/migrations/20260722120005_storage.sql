-- =============================================================================
-- Estelamaris — 05 · Storage (bucket privado "notas")
-- Cada usuário só faz upload/lê em notas/{user_id}/...  A service_role lê tudo
-- (o role service_role ignora RLS, então não precisa de policy própria).
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('notas', 'notas', false)
on conflict (id) do nothing;

-- Upload: só na própria pasta {user_id}/
create policy "notas: upload na própria pasta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'notas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Leitura: só arquivos da própria pasta {user_id}/
create policy "notas: lê a própria pasta"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'notas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
