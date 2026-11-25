-- v2 (15.11 S3–S5; docs/v2/AumMon_Technical_Migration_Plan.md M1, M3, M4, M5, M7, M8).
-- Additive only. Guests = Supabase anonymous users (JWT claim is_anonymous).

-- M1: guest helper in public (RLS policies run as `authenticated`, which has no usage on `private`).
-- It only reads the caller's own JWT claim; account-only tables add a restrictive policy using it.
create or replace function public.is_guest()
returns boolean
language sql
stable
set search_path = ''
-- Reads the claims PostgREST sets (same source as auth.jwt(), which older images lack).
as $$ select coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false) $$;
revoke all on function public.is_guest() from public;
grant execute on function public.is_guest() to authenticated, service_role;

-- M3: host settings per room (BLUFF: slow timers, humor 1–2, group prompts).
alter table public.game_rooms add column settings jsonb not null default '{}'::jsonb
  check (jsonb_typeof(settings) = 'object');

-- M5: content (private schema: never exposed through the API; Edge Functions only).
create or replace function private.distinct_text_count(arr jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$ select count(distinct v)::integer from jsonb_array_elements_text(arr) v $$;
revoke all on function private.distinct_text_count(jsonb) from public, anon, authenticated;

create table private.content_items (
  id text primary key check (id ~ '^[a-z0-9_-]{3,80}$'),
  game_id text not null references public.games(id),
  category text not null check (char_length(category) between 2 and 32),
  locale text not null default 'th' check (locale in ('th', 'en')),
  humor smallint not null check (humor between 1 and 3),
  min_players smallint not null default 2 check (min_players between 2 and 8),
  max_players smallint not null default 8 check (max_players between 2 and 8),
  modes text[] not null default array['casual'],
  body jsonb not null,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'retired')),
  review_note text,
  version integer not null default 1 check (version >= 1),
  author_id uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_players <= max_players),
  -- BLUFF body: prompt ≤ 120 chars, exactly 4 distinct options ≤ 40 chars.
  check (game_id <> 'bluff' or (
    jsonb_typeof(body -> 'prompt') = 'string'
    and char_length(body ->> 'prompt') between 5 and 120
    and jsonb_typeof(body -> 'options') = 'array'
    and jsonb_array_length(body -> 'options') = 4
    and char_length(body -> 'options' ->> 0) between 1 and 40
    and char_length(body -> 'options' ->> 1) between 1 and 40
    and char_length(body -> 'options' ->> 2) between 1 and 40
    and char_length(body -> 'options' ->> 3) between 1 and 40
    and private.distinct_text_count(body -> 'options') = 4))
);
create index content_items_pick_idx on private.content_items (game_id, locale, status);

create table private.content_item_history (
  id bigint generated always as identity primary key,
  content_id text not null references private.content_items(id) on delete cascade,
  version integer not null,
  body jsonb not null,
  status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table private.content_reports (
  content_id text not null references private.content_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (content_id, user_id)
);

revoke all on private.content_items, private.content_item_history, private.content_reports
  from public, anon, authenticated;
grant select, insert, update, delete on private.content_items, private.content_item_history,
  private.content_reports to service_role;

-- M7: BLUFF in the registry (ruleset "2", 2–8 players).
insert into public.games (id, display_name_th, display_name_en, is_enabled, min_players, max_players, current_ruleset, sort_order)
values ('bluff', 'BLUFF', 'BLUFF', true, 2, 8, '2', 0)
on conflict (id) do update set is_enabled = true, current_ruleset = '2', min_players = 2, max_players = 8;

-- M4: guest cleanup (user FKs on rooms / matches are already "on delete set null").
create or replace function private.cleanup_guests(inactive interval default interval '30 days')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  with gone as (
    delete from auth.users u
    where u.is_anonymous
      and coalesce(u.last_sign_in_at, u.created_at) < now() - inactive
      and coalesce(u.updated_at, u.created_at) < now() - inactive
      and not exists (
        select 1 from public.room_players rp
        join public.game_rooms r on r.id = rp.room_id
        where rp.user_id = u.id and rp.status <> 'left' and r.status in ('lobby', 'playing'))
    returning 1)
  select count(*) into removed from gone;
  return removed;
end;
$$;
revoke all on function private.cleanup_guests(interval) from public, anon, authenticated;
grant execute on function private.cleanup_guests(interval) to service_role;

-- Daily cleanup job where pg_cron is available (Supabase projects); skipped otherwise.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('aummon-cleanup-guests', '17 3 * * *', 'select private.cleanup_guests()');
  end if;
end;
$$;
