-- Game Center GC1.3 — game registry + game_id defaults.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select is((select count(*)::int from public.games), 3, 'three games registered');
select has_column('public', 'game_rooms', 'game_id', 'game_id column exists on rooms');
select col_default_is('public', 'game_rooms', 'game_id', 'edo_battle'::text, 'rooms default to EDO Battle');
select col_default_is('public', 'matches', 'game_id', 'edo_battle'::text, 'matches default to EDO Battle');

-- Dummy and Poker are retired (v2): rows kept, switched off.
select is((select count(*)::int from public.games where is_enabled), 1, 'only EDO Battle is enabled');
set local role authenticated;
select is((select count(*)::int from public.games), 1, 'players see enabled games only');
select throws_ok($$update public.games set is_enabled = true$$, '42501', null, 'players cannot change games');
reset role;
set local role anon;
select throws_ok($$select * from public.games$$, '42501', null, 'anon cannot read games');
reset role;

select throws_ok(
  $$insert into public.game_rooms (owner_id, mode, game_id, ruleset_version) values (null, 'solo', 'edo_battle', '99')$$,
  '23514', null, 'EDO rooms keep their ruleset list');

select * from finish();
rollback;
