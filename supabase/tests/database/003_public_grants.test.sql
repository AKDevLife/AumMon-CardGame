-- Task 2.3 — least-privilege grants on public tables.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'),
  0, 'anon has no table privileges in public');

select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'authenticated' and privilege_type <> 'SELECT'),
  0, 'authenticated has only SELECT at table level');

select ok(has_table_privilege('authenticated', 'public.matches', 'select'), 'authenticated can select matches (RLS filters rows)');
select ok(not has_table_privilege('authenticated', 'public.matches', 'insert'), 'authenticated cannot insert matches');
select ok(not has_table_privilege('authenticated', 'public.match_players', 'update'), 'authenticated cannot update match_players (HP)');
select ok(not has_table_privilege('authenticated', 'public.match_events', 'insert'), 'authenticated cannot insert events');
select ok(not has_table_privilege('authenticated', 'public.game_rooms', 'delete'), 'authenticated cannot delete rooms');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'insert'), 'authenticated cannot insert profiles (trigger does)');

select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update'), 'authenticated can update display_name');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'id', 'update'), 'authenticated cannot update profile id');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'updated_at', 'update'), 'authenticated cannot set updated_at');

select ok(has_table_privilege('service_role', 'public.match_players', 'update'), 'service_role can update match_players');

-- Default privileges: a table created later by postgres gets no client grants.
create table public.__grant_probe (id int);
select ok(not has_table_privilege('authenticated', 'public.__grant_probe', 'select')
  and not has_table_privilege('anon', 'public.__grant_probe', 'select'),
  'new public tables are not granted to clients by default');

select * from finish();
rollback;
