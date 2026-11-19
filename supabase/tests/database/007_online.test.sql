-- Phase 6 — rate-limit table is server-only; Realtime publication never includes private data.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select ok(not has_table_privilege('authenticated', 'private.rate_limits', 'select'), 'clients cannot read rate limits');
select ok(has_table_privilege('service_role', 'private.rate_limits', 'insert'), 'server can write rate limits');
select is(
  (select count(*)::int from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'private'),
  0, 'no private table is published to Realtime');
select is(
  (select array_agg(tablename::text order by tablename) from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'),
  array['game_rooms', 'matches', 'room_players'], 'only public mirror tables are published');

select * from finish();
rollback;
