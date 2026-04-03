-- Fernhollow Stage 1: run this in Supabase SQL Editor or via CLI migrations.
-- Project: fernhollow (separate from Blirt per spec).

-- Table 1: fernhollow_conversations
create table if not exists public.fernhollow_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agent text not null,
  role text not null,
  content text not null,
  session_id text not null,
  location text not null,
  business text
);

create index if not exists idx_fernhollow_conversations_session
  on public.fernhollow_conversations (session_id, created_at);

-- Table 2: fernhollow_memory
create table if not exists public.fernhollow_memory (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  agent text not null,
  category text not null,
  key text not null,
  value text not null,
  business text,
  confidence double precision
);

create index if not exists idx_fernhollow_memory_agent_business
  on public.fernhollow_memory (agent, business, updated_at desc);

-- Table 3: fernhollow_content
create table if not exists public.fernhollow_content (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agent text not null,
  business text not null,
  content_type text not null,
  platform text,
  content text not null,
  status text not null default 'draft',
  scheduled_at timestamptz,
  posted_at timestamptz,
  performance jsonb
);

create index if not exists idx_fernhollow_content_business_status
  on public.fernhollow_content (business, status, created_at desc);

-- Table 4: fernhollow_treasury
create table if not exists public.fernhollow_treasury (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null,
  category text not null,
  amount_cents integer not null,
  description text not null,
  business text,
  month text not null
);

create index if not exists idx_fernhollow_treasury_month
  on public.fernhollow_treasury (month, type);

-- Table 5: fernhollow_tasks
create table if not exists public.fernhollow_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agent text not null,
  task_type text not null,
  business text,
  status text not null default 'pending',
  output text,
  run_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_fernhollow_tasks_status_run
  on public.fernhollow_tasks (status, run_at);

-- Optional: keep updated_at fresh on memory rows (for future upserts)
create or replace function public.set_fernhollow_memory_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fernhollow_memory_updated_at on public.fernhollow_memory;
create trigger trg_fernhollow_memory_updated_at
  before update on public.fernhollow_memory
  for each row
  execute procedure public.set_fernhollow_memory_updated_at();
