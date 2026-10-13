-- Frost Skaters: Einmal im SQL Editor deines EIGENEN Supabase Projekts ausführen.
-- Der Besitzer muss anschließend in Authentication > Users seinen Admin-Account anlegen
-- und die letzte SQL-Anweisung mit seiner User-UUID ausführen.
-- User-Namen werden als Spitznamen genutzt; keine Telefonnummern speichern.

create extension if not exists pgcrypto;

create table if not exists public.frost_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.frost_member_requests (
  id uuid primary key default gen_random_uuid(),
  request_code uuid not null unique,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
  role text not null default 'MEMBER' check (role in ('MEMBER','MODERATOR','CO-OWNER','OWNER')),
  member_no text unique,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint member_pending_is_unapproved
    check (status <> 'pending' or (role = 'MEMBER' and member_no is null and processed_at is null))
);

create index if not exists frost_member_requests_created_idx on public.frost_member_requests(created_at desc);

alter table public.frost_admins enable row level security;
alter table public.frost_member_requests enable row level security;

revoke all on public.frost_admins from anon, authenticated;
revoke all on public.frost_member_requests from anon, authenticated;
grant select on public.frost_admins to authenticated;
grant insert on public.frost_member_requests to anon;
grant select, update on public.frost_member_requests to authenticated;

drop policy if exists "frost_admin_self_read" on public.frost_admins;
create policy "frost_admin_self_read" on public.frost_admins
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "frost_apply_only" on public.frost_member_requests;
create policy "frost_apply_only" on public.frost_member_requests
  for insert to anon with check (
    status = 'pending' and role = 'MEMBER'
    and member_no is null and processed_at is null
  );

drop policy if exists "frost_owner_read" on public.frost_member_requests;
create policy "frost_owner_read" on public.frost_member_requests
  for select to authenticated
  using (exists (select 1 from public.frost_admins a where a.user_id = (select auth.uid())));

drop policy if exists "frost_owner_update" on public.frost_member_requests;
create policy "frost_owner_update" on public.frost_member_requests
  for update to authenticated
  using (exists (select 1 from public.frost_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.frost_admins a where a.user_id = (select auth.uid())));

-- Öffentliche Prüfung funktioniert nur mit dem geheimen, zufällig erstellten UUID-Code.
-- Die Tabelle selbst ist für Besucher NICHT lesbar, auch nicht mit einer ID.
create or replace function public.frost_find_member(p_code uuid)
returns table (
  display_name text,
  role text,
  member_no text
)
language sql stable security definer
set search_path = ''
as $$
  select r.display_name, r.role, r.member_no
  from public.frost_member_requests r
  where r.request_code = p_code and r.status = 'approved'
  limit 1;
$$;
revoke all on function public.frost_find_member(uuid) from public;
grant execute on function public.frost_find_member(uuid) to anon, authenticated;

-- WICHTIG: Danach eine echte Supabase Auth User UUID in der SQL Editor Console einfügen:
-- insert into public.frost_admins(user_id)
-- values ('HIER-DEINE-SUPABASE-AUTH-USER-UUID') on conflict do nothing;
