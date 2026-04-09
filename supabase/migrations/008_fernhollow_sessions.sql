-- Stable chat session IDs per user per place (survives tab close / new visit).
create table if not exists public.fernhollow_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_key text not null,
  slug text not null,
  session_id text not null unique,
  unique (user_key, slug)
);

create index if not exists idx_fernhollow_sessions_user_slug
  on public.fernhollow_sessions (user_key, slug);
