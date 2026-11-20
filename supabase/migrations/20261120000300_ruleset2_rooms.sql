-- Task 8.10 — rooms for ruleset 2 (1v1 TCG): no characters, ruleset tag on rooms.
alter table public.game_rooms
  add column ruleset_version text not null default '1' check (ruleset_version in ('1','2'));
alter table public.game_rooms add constraint game_rooms_ruleset2_two_players
  check (ruleset_version = '1' or max_players = 2);
alter table public.room_players alter column character_id drop not null;
