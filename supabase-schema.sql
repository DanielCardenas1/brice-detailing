-- BRICE DEMO — Supabase schema
-- This is intentionally a DEMO policy set so the public experience and /admin
-- can share the same prototype data without a login. Before production, replace
-- these policies with Supabase Auth + role-based RLS.

create extension if not exists pgcrypto;

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'in_progress',
  source text not null default 'demo_public',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid references public.experiences(id) on delete set null,
  status text not null default 'new',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.experiences enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "demo experiences anon all" on public.experiences;
create policy "demo experiences anon all" on public.experiences for all to anon using (true) with check (true);

drop policy if exists "demo bookings anon all" on public.bookings;
create policy "demo bookings anon all" on public.bookings for all to anon using (true) with check (true);

-- Realtime publication for live admin updates.
do $$ begin
  alter publication supabase_realtime add table public.experiences;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.bookings;
exception when duplicate_object then null;
end $$;

-- Demo grants (anon only). For production, remove these and use authenticated roles.
grant select, insert, update, delete on public.experiences to anon;
grant select, insert, update, delete on public.bookings to anon;
