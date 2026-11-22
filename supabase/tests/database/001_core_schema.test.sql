-- Core schema (Discard Edition, task 12.4): tables, constraints, schema separation, RLS deny-by-default.
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

select has_table('public', t, 'public.' || t) from unnest(array[
  'profiles','game_rooms','room_players','matches','match_players','match_events']) t;
select has_table('private', t, 'private.' || t) from unnest(array['match_runtime','command_receipts']) t;
select hasnt_table('public', t, 'old game table removed: ' || t) from unnest(array[
  'characters','card_definitions','deck_templates','deck_template_cards']) t;

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0, 'RLS enabled on all public tables');
select ok(not has_schema_privilege('anon', 'private', 'usage'), 'anon has no usage on private');
select ok(not has_schema_privilege('authenticated', 'private', 'usage'), 'authenticated has no usage on private');
select ok(has_schema_privilege('service_role', 'private', 'usage'), 'service_role can use private');

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'a@test.local');
insert into public.game_rooms (id, owner_id, mode, max_players)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'solo', 8);
insert into public.matches (id, room_id, engine_version, ruleset_version)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '5.0.0', '11');
insert into public.match_players (id, match_id, user_id, seat, player_type, hand_count)
  values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-00000000000a', 1, 'human', 7);

select lives_ok($$insert into public.room_players (room_id, seat, player_type, display_name_snapshot)
  values ('10000000-0000-0000-0000-000000000001', 8, 'bot', 'Bot 7')$$, 'seat 8 allowed (2–8 players)');
select throws_ok($$insert into public.room_players (room_id, seat, player_type, display_name_snapshot)
  values ('10000000-0000-0000-0000-000000000001', 9, 'bot', 'Bot 8')$$, '23514', null, 'seat 9 rejected');
select throws_ok($$insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 3, 'bot', 'x')$$,
  '23514', null, 'bot seat cannot have user_id');
select throws_ok($$insert into public.game_rooms (owner_id, mode, max_players)
  values ('00000000-0000-0000-0000-00000000000a', 'online', 9)$$, '23514', null, 'max 8 players');
select throws_ok($$insert into public.matches (room_id, engine_version, ruleset_version)
  values ('10000000-0000-0000-0000-000000000001', '1.0.0', '6')$$, '23514', null, 'only ruleset 7 matches');
select throws_ok($$update public.match_players set hand_count = -1$$, '23514', null, 'hand count >= 0');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$update public.match_players set hand_count = 0$$, '42501', null, 'authenticated cannot update hand counts (grant)');
select throws_ok($$select * from private.match_runtime$$, '42501', null, 'authenticated cannot read private.match_runtime');
reset role;

set local role anon;
select throws_ok($$select * from public.matches$$, '42501', null, 'anon has no access to public tables');
reset role;

select is((select max(hand_count)::int from public.match_players), 7, 'client update had no effect');

select * from finish();
rollback;
