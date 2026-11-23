-- Game Center GC2.6 / GC4.4 — stats are owner-only, the matchmaking queue is private.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select has_table('public', 'player_game_stats', 'player_game_stats exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.player_game_stats'::regclass),
  'RLS on player_game_stats');
select ok(not has_table_privilege('authenticated', 'private.matchmaking_queue', 'select'),
  'clients cannot read the matchmaking queue');

set local role authenticated;
select throws_ok($$insert into public.player_game_stats (user_id, game_id) values (gen_random_uuid(), 'dummy')$$,
  '42501', null, 'clients cannot write stats');
reset role;
set local role anon;
select throws_ok($$select * from public.player_game_stats$$, '42501', null, 'anon cannot read stats');
reset role;

select * from finish();
rollback;
