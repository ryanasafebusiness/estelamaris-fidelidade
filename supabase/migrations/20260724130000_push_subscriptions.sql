-- =============================================================================
-- Estelamaris — 18 · Notificações push (Web Push)
-- Guarda as inscrições de push (PushSubscription) de cada cliente. O cliente só
-- gerencia as próprias (assina/some); o envio real é feito pelo servidor
-- (rota /api/push/send, chamada pelo n8n) usando a service_role.
-- =============================================================================
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth_key   text not null,
  user_agent text,
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id) where ativo;

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

grant select, delete on public.push_subscriptions to authenticated;
grant insert (user_id, endpoint, p256dh, auth_key, user_agent) on public.push_subscriptions to authenticated;
grant update (ativo) on public.push_subscriptions to authenticated;

create policy "push_subscriptions: vê as próprias" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

create policy "push_subscriptions: insere a própria" on public.push_subscriptions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "push_subscriptions: atualiza a própria" on public.push_subscriptions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "push_subscriptions: apaga a própria" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));
