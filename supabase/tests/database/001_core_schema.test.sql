-- Task 2.1 — schema, constraints, schema separation and RLS deny-by-default.
begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

-- Tables (blueprint §3.2; optional match_private_events not created)
select has_table('public', t, 'public.' || t) from unnest(array[
  'profiles','characters','card_definitions','deck_templates','deck_template_cards',
  'game_rooms','room_players','matches','match_players','match_events']) t;
select has_table('private', t, 'private.' || t) from unnest(array[
  'match_runtime','match_cards','match_player_runtime','round_submissions','command_receipts']) t;

-- RLS enabled on every public table
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0, 'RLS enabled on all public tables');

-- Schema separation
select ok(not has_schema_privilege('anon', 'private', 'usage'), 'anon has no usage on private');
select ok(not has_schema_privilege('authenticated', 'private', 'usage'), 'authenticated has no usage on private');
select ok(has_schema_privilege('service_role', 'private', 'usage'), 'service_role can use private');
select ok(has_table_privilege('service_role', 'private.match_cards', 'select'), 'service_role reads private tables');

-- Fixtures (as postgres)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local');
insert into public.characters (id, name, element, base_hp, speed, hook, effect_key, description)
  values ('c1','C1','fire',3,70,'onAttack','K1','d'), ('c2','C2','water',3,60,'onTurnStart','K2','d');
insert into public.card_definitions (id, name, card_type, description) values ('card1','Card','attack','d');
insert into public.deck_templates (id, version, is_active) values ('std', 1, true);
insert into public.game_rooms (id, owner_id, mode)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'solo'),
         ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'solo');
insert into public.matches (id, room_id, deck_template_id, deck_template_version, engine_version, ruleset_version)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'std', 1, '0.1.0', '1'),
         ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'std', 1, '0.1.0', '1');
insert into public.match_players (id, match_id, user_id, seat, player_type, character_id, character_snapshot, hp, max_hp, speed)
  values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-00000000000a', 1, 'human', 'c1', '{}', 3, 3, 70),
         ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
          null, 1, 'bot', 'c1', '{}', 3, 3, 70);

-- Deck template versioning (composite key)
select lives_ok($$insert into public.deck_templates (id, version) values ('std', 2)$$, 'second deck version allowed');
select throws_ok($$insert into public.deck_templates (id, version, is_active) values ('std', 3, true)$$,
  '23505', null, 'only one active version per deck');
select throws_ok($$insert into public.matches (room_id, deck_template_id, deck_template_version, engine_version, ruleset_version)
  values ('10000000-0000-0000-0000-000000000001', 'std', 99, '0.1.0', '1')$$, '23503', null, 'match must reference existing deck version');

-- Player constraints
select throws_ok($$insert into public.room_players (room_id, user_id, seat, player_type, character_id, display_name_snapshot)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 3, 'bot', 'c2', 'x')$$, '23514', null, 'bot seat cannot have user_id (human with null user_id = deleted account, task 7.4)');
select lives_ok($$insert into public.room_players (room_id, seat, player_type, character_id, display_name_snapshot)
  values ('10000000-0000-0000-0000-000000000001', 1, 'bot', 'c1', 'Bot')$$, 'bot seat without user_id');
select throws_ok($$insert into public.room_players (room_id, seat, player_type, character_id, display_name_snapshot)
  values ('10000000-0000-0000-0000-000000000001', 2, 'bot', 'c1', 'Bot2')$$, '23505', null, 'character unique per room');
select throws_ok($$insert into public.match_players (match_id, seat, player_type, character_id, character_snapshot, hp, max_hp, speed)
  values ('20000000-0000-0000-0000-000000000001', 2, 'bot', 'c1', '{}', 3, 3, 70)$$, '23505', null, 'character unique per match');

-- Private card zones / cross-match FKs
select throws_ok($$insert into private.match_cards (match_id, card_definition_id, card_snapshot, zone)
  values ('20000000-0000-0000-0000-000000000001', 'card1', '{}', 'hand')$$, '23514', null, 'hand card needs owner');
select throws_ok($$insert into private.match_cards (match_id, card_definition_id, card_snapshot, zone, owner_match_player_id)
  values ('20000000-0000-0000-0000-000000000001', 'card1', '{}', 'hand', '30000000-0000-0000-0000-000000000002')$$,
  '23503', null, 'hand owner must belong to the same match');

-- Client roles: deny by default
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*)::int from public.matches), 0, 'authenticated sees no matches without policies');
select throws_ok($$update public.match_players set hp = 99$$, '42501', null, 'authenticated cannot update HP (grant)');
select throws_ok($$select * from private.match_cards$$, '42501', null, 'authenticated cannot read private.match_cards');
select throws_ok($$insert into private.round_submissions (match_id, round_number, match_player_id, card_instance_id, idempotency_key)
  values (gen_random_uuid(), 1, gen_random_uuid(), gen_random_uuid(), gen_random_uuid())$$, '42501', null,
  'authenticated cannot write submissions');
reset role;

set local role anon;
select throws_ok($$select * from public.characters$$, '42501', null, 'anon has no access to public tables');
select throws_ok($$select * from private.match_runtime$$, '42501', null, 'anon cannot read private.match_runtime');
reset role;

select is((select max(hp)::int from public.match_players), 3, 'authenticated HP update had no effect');

select * from finish();
rollback;
