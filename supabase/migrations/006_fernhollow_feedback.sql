-- Frankie's approve/dismiss feedback on briefings (drives morning briefing prompts).
create table if not exists public.fernhollow_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agent text not null,
  content_id uuid not null references public.fernhollow_content (id) on delete cascade,
  action text not null,
  note text,
  content_type text not null,
  business text not null,
  stop_suggesting boolean not null default false
);

create index if not exists idx_fernhollow_feedback_agent_created
  on public.fernhollow_feedback (agent, created_at desc);
