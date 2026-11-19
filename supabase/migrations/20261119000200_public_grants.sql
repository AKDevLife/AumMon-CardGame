-- AumMon task 2.3 — least-privilege grants for client roles on public tables.
-- Supabase grants ALL on public objects to anon/authenticated by default; RLS is the
-- second line of defence, grants are the first. Clients get read-only access to the
-- tables they need; all game-state writes go through server code (service_role).
-- Row filtering is done by RLS policies (task 2.4).

-- 1. Remove broad defaults on existing objects.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- 2. Future objects created by postgres (our migrations) get no client privileges
--    unless a migration grants them explicitly.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- 3. Explicit client grants (authenticated only — an account is required, spec §1).
grant select on
  public.profiles,
  public.characters,
  public.card_definitions,
  public.deck_templates,
  public.deck_template_cards,
  public.game_rooms,
  public.room_players,
  public.matches,
  public.match_players,
  public.match_events
to authenticated;

-- Players may edit only their own profile's public fields (row check: RLS in 2.4).
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- service_role (server) keeps full access to public tables.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
