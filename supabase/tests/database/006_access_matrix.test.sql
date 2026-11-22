-- Task 2.6 — access matrix (blueprint §4.4): User A, User B, non-member, anonymous, service_role.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a001', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000b001', 'b@test.local'),
  ('00000000-0000-0000-0000-00000000c001', 'c@test.local');
-- A: solo room (A + bot) + match. B: online lobby (no match yet) that A has not joined.
insert into public.game_rooms (id, owner_id, mode) values
  ('10000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a001', 'solo'),
  ('10000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000b001', 'online');
insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot) values
  ('10000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a001', 1, 'human', 'A'),
  ('10000000-0000-0000-0000-00000000a001', null, 2, 'bot', 'Bot 1'),
  ('10000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000b001', 1, 'human', 'B');
insert into public.matches (id, room_id, engine_version, ruleset_version) values
  ('20000000-0000-0000-0000-00000000a001', '10000000-0000-0000-0000-00000000a001', '3.0.0', '9');
insert into public.match_players (id, match_id, user_id, seat, player_type, hand_count) values
  ('30000000-0000-0000-0000-00000000a001', '20000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000a001', 1, 'human', 7),
  ('30000000-0000-0000-0000-00000000a002', '20000000-0000-0000-0000-00000000a001', null, 2, 'bot', 7);
insert into private.match_runtime (match_id, rng_state) values ('20000000-0000-0000-0000-00000000a001', '\x00');

-- ---------- User A (solo owner)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated"}', true),
       set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', true);
select is((select count(*)::int from public.matches), 1, 'owner sees solo match');
select is((select count(*)::int from public.match_players), 2, 'owner sees all seats in match');
select is((select count(*)::int from public.room_players), 2, 'owner sees own room seats only');
select ok(not public.is_room_member('10000000-0000-0000-0000-00000000b001'), 'A is not a member of B lobby');
select is((select count(*)::int from public.game_rooms where id = '10000000-0000-0000-0000-00000000b001'), 0, 'A cannot read B lobby');
-- private schema: every table denied, even for own hand
select throws_ok(format('select * from private.%I', t), '42501', null, 'A cannot read private.' || t)
  from unnest(array['match_runtime','command_receipts','round_stats']) t;
select throws_ok($$insert into public.match_events (match_id, event_seq, round_number, event_type)
  values ('20000000-0000-0000-0000-00000000a001', 99, 1, 'fake')$$, '42501', null, 'A cannot forge events');
select throws_ok($$update public.matches set phase = 'finished'$$, '42501', null, 'A cannot change match phase');
reset role;

-- ---------- User B (lobby member, no match)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b001","role":"authenticated"}', true),
       set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b001', true);
select is((select count(*)::int from public.game_rooms), 1, 'B reads own lobby');
select is((select count(*)::int from public.room_players), 1, 'B reads own lobby seats only');
select is((select count(*)::int from public.matches), 0, 'B cannot read A solo match');
select ok(not public.is_match_member('20000000-0000-0000-0000-00000000a001'), 'B is not a member of A match');
reset role;

-- ---------- Non-member C
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c001","role":"authenticated"}', true),
       set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c001', true);
select is((select count(*)::int from public.room_players) + (select count(*)::int from public.match_players)
  + (select count(*)::int from public.match_events), 0, 'non-member reads no room/match data');
reset role;

-- ---------- Anonymous: no access to any public table
select is((select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and has_table_privilege('anon', c.oid, 'select')), 0,
  'anon cannot select any public table');

-- ---------- service_role (server) sees everything
set local role service_role;
select is((select count(*)::int from private.match_runtime where match_id = '20000000-0000-0000-0000-00000000a001'), 1,
  'service_role reads private state');
select is((select count(*)::int from public.game_rooms where id in
  ('10000000-0000-0000-0000-00000000a001', '10000000-0000-0000-0000-00000000b001')), 2, 'service_role bypasses RLS');
reset role;

select * from finish();
rollback;
