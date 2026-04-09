-- Optional: add Frankie's global prefs for all chats (edit in Table Editor anytime):
-- insert into public.fernhollow_memory (agent, category, key, value, business, confidence)
-- values ('shared', 'preference', 'frankie_global', 'Warm, concrete language. No em-dashes in final copy.', 'fernhollow', 1);

-- Lightweight API usage / cost estimates (Anthropic, fal.ai, etc.)
create table if not exists public.fernhollow_usage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  service text not null,
  operation text not null,
  units numeric,
  cost_usd_est numeric,
  meta jsonb
);

create index if not exists idx_fernhollow_usage_created
  on public.fernhollow_usage_events (created_at desc);

-- Public bucket for generated sellable files (xlsx, future PDFs). Service role uploads from API.
insert into storage.buckets (id, name, public)
values ('sellables', 'sellables', true)
on conflict (id) do update set public = excluded.public;

-- Allow anyone to read objects (URLs use unguessable UUID paths)
drop policy if exists "Public read sellables" on storage.objects;
create policy "Public read sellables"
  on storage.objects for select
  to public
  using (bucket_id = 'sellables');
