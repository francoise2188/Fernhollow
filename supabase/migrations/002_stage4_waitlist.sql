-- Stage 4: waitlist for Fernhollow-as-a-product (run in Supabase SQL Editor).

create table if not exists public.fernhollow_waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique
);

create index if not exists idx_fernhollow_waitlist_created
  on public.fernhollow_waitlist (created_at desc);
