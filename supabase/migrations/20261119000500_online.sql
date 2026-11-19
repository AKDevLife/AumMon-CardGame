-- AumMon Phase 6 — online lobby support.
-- * Rate limits (join-code guessing, commands) — server only.
-- * Realtime notifications via Postgres Changes on rows clients may already read
--   (RLS decides who receives them). Only public mirror columns are published;
--   private game data never enters the publication.

create table private.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (user_id, action, window_start)
);
revoke all on private.rate_limits from public, anon, authenticated;
grant select, insert, update, delete on private.rate_limits to service_role;

alter publication supabase_realtime add table public.matches, public.room_players, public.game_rooms;
