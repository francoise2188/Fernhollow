-- Inter-agent “chimes” (Haiku handoffs, lightweight messages between girls).
create table if not exists public.fernhollow_chimes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_agent text not null,
  to_agent text not null,
  message text not null,
  context_type text not null,
  source_content_id uuid references public.fernhollow_content (id),
  read boolean not null default false
);

create index if not exists idx_fernhollow_chimes_to_agent_created
  on public.fernhollow_chimes (to_agent, created_at desc);

create index if not exists idx_fernhollow_chimes_unread
  on public.fernhollow_chimes (to_agent, read)
  where read = false;
