-- OAuth tokens and shop linkage for external platforms (e.g. Etsy for Wren).
create table if not exists public.fernhollow_integrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  agent text not null,
  platform text not null,
  shop_id text,
  shop_name text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  unique (agent, platform)
);

create index if not exists idx_fernhollow_integrations_agent_platform
  on public.fernhollow_integrations (agent, platform);
