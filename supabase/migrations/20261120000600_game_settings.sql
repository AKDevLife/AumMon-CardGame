-- Task 9.11 — global game settings edited by admins (first use: sound effects).
-- Players may read; only admin-api (server, audited) writes.
create table public.game_settings (
  key text primary key check (key ~ '^[a-z_]{1,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

grant select on public.game_settings to authenticated;
alter table public.game_settings enable row level security;
create policy "authenticated read game settings"
on public.game_settings for select to authenticated using (true);
