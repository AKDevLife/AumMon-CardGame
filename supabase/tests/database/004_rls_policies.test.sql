-- Task 2.4 (both claim settings are set: the local image's auth.uid() reads the legacy one)
-- — RLS: User A, User B, non-member, anonymous (blueprint §4.3, Phase 2 acceptance).
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Fixtures: A owns room/match 1 with bot; B owns room/match 2; C is a non-member.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000aa', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000bb', 'b@test.local'),
  ('00000000-0000-0000-0000-0000000000cc', 'c@test.local');
insert into public.game_rooms (id, owner_id, mode) values
  ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000aa', 'solo'),
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000bb', 'online');
insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot) values
  ('10000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000bb', 1, 'human', 'B');
insert into public.matches (id, room_id, engine_version, ruleset_version) values
  ('20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', '4.0.0', '10'),
  ('20000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-0000000000b1', '4.0.0', '10');
insert into public.match_players (match_id, user_id, seat, player_type) values
  ('20000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000aa', 1, 'human'),
  ('20000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000bb', 1, 'human');
insert into public.match_events (match_id, event_seq, round_number, event_type) values
  ('20000000-0000-0000-0000-0000000000a1', 1, 1, 'round.started'),
  ('20000000-0000-0000-0000-0000000000b1', 1, 1, 'round.started');

-- Helper security
select ok((select prosecdef and 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.is_match_member(uuid)'::regprocedure),
  'is_match_member: SECURITY DEFINER + empty search_path');
select ok((select prosecdef and 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.is_room_member(uuid)'::regprocedure),
  'is_room_member: SECURITY DEFINER + empty search_path');
select ok(not has_function_privilege('anon', 'public.is_match_member(uuid)', 'execute'), 'anon cannot call is_match_member');

-- ---------------- User A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', true),
       set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000aa', true);
select is((select count(*)::int from public.profiles), 1, 'A reads only own profile');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000bb'), 0, 'A cannot read B profile');
update public.profiles set display_name = 'Hacked' where id = '00000000-0000-0000-0000-0000000000bb';
update public.profiles set display_name = 'Aum' where id = '00000000-0000-0000-0000-0000000000aa';
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000aa'), 'Aum', 'A updates own profile');
select is((select array_agg(id::text) from public.matches), array['20000000-0000-0000-0000-0000000000a1'], 'A sees only own match');
select is((select count(*)::int from public.match_players), 1, 'A sees only own match players');
select is((select count(*)::int from public.match_events), 1, 'A sees only own match events');
select is((select count(*)::int from public.game_rooms), 1, 'A sees only own room');
select ok(public.is_match_member('20000000-0000-0000-0000-0000000000a1'), 'A is member of match A');
select ok(not public.is_match_member('20000000-0000-0000-0000-0000000000b1'), 'A is not member of match B');
reset role;

select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000bb'),
  'Player-000000', 'A could not modify B profile');

-- ---------------- User B (room member via room_players)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000bb","role":"authenticated"}', true),
       set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000bb', true);
select is((select count(*)::int from public.room_players), 1, 'B sees own room seats');
select is((select array_agg(id::text) from public.matches), array['20000000-0000-0000-0000-0000000000b1'], 'B sees only own match');
select throws_ok($$update public.profiles set id = gen_random_uuid() where id = '00000000-0000-0000-0000-0000000000bb'$$,
  '42501', null, 'B cannot change profile id');
reset role;

-- ---------------- Non-member C
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000cc","role":"authenticated"}', true),
       set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000cc', true);
select is((select count(*)::int from public.matches), 0, 'non-member reads no matches');
select is((select count(*)::int from public.match_players), 0, 'non-member reads no match players');
select is((select count(*)::int from public.game_rooms), 0, 'non-member reads no rooms');
reset role;

-- ---------------- Anonymous
set local role anon;
select throws_ok($$select * from public.matches$$, '42501', null, 'anon cannot read matches');
reset role;

select * from finish();
rollback;
