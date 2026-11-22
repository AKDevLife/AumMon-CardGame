-- Task 7.4 — deleting an auth user removes personal links, keeps anonymized history.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d001', 'del@test.local', '{"display_name":"Deleter"}');
insert into public.game_rooms (id, owner_id, mode, status) values
  ('10000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d001', 'online', 'closed');
insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot)
  values ('10000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d001', 1, 'human', 'Deleter');
insert into public.matches (id, room_id, engine_version, ruleset_version, status)
  values ('20000000-0000-0000-0000-00000000d001', '10000000-0000-0000-0000-00000000d001', '1.0.0', '7', 'finished');
insert into public.match_players (match_id, user_id, seat, player_type)
  values ('20000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d001', 1, 'human');

select lives_ok($$delete from auth.users where id = '00000000-0000-0000-0000-00000000d001'$$, 'user with history can be deleted');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000d001'), 0, 'profile removed');
select is((select owner_id from public.game_rooms where id = '10000000-0000-0000-0000-00000000d001'), null, 'room kept, owner unlinked');
select is((select display_name_snapshot from public.room_players where room_id = '10000000-0000-0000-0000-00000000d001'),
  'ผู้เล่นที่ลบบัญชี', 'seat anonymized');
select is((select count(*)::int from public.match_players where match_id = '20000000-0000-0000-0000-00000000d001' and user_id is null), 1,
  'match history kept without user link');
select throws_ok($$insert into public.room_players (room_id, user_id, seat, player_type, display_name_snapshot)
  values ('10000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000d001', 2, 'bot', 'x')$$,
  '23514', null, 'bots still cannot have a user id');
select * from finish();
rollback;
