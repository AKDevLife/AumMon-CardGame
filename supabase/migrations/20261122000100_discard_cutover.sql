-- Task 12.4 — Casual Discard Edition cutover (owner 2026-11-22: "start a new version; delete everything
-- of the old game"). Accounts, profiles, admin, metrics, settings and rooms/matches tables are kept;
-- old matches/rooms (all rulesets 1–6, Dev only) and old card catalogue tables are removed.
-- Cards now live in the engine (packages/game-engine/src/discard/cards.ts) as data.

delete from public.matches;      -- cascades to match_players, match_events, private runtime rows
delete from public.game_rooms;   -- cascades to room_players

drop table if exists private.round_submissions;
drop table if exists private.match_player_runtime;
drop table if exists private.match_cards;

alter table public.matches drop column deck_template_id, drop column deck_template_version;
alter table public.matches drop constraint matches_phase_check;
alter table public.matches add constraint matches_phase_check check (phase in ('play', 'reaction', 'finished'));
alter table public.matches add constraint matches_ruleset_check check (ruleset_version = '7');

alter table public.match_players
  drop column character_id, drop column character_snapshot, drop column hp, drop column max_hp, drop column speed,
  add column hand_count smallint not null default 0 check (hand_count >= 0);
alter table public.match_players drop constraint match_players_seat_check;
alter table public.match_players add constraint match_players_seat_check check (seat between 1 and 8);
alter table public.match_players drop constraint match_players_status_check;
alter table public.match_players add constraint match_players_status_check check (status in ('playing', 'won', 'left'));
alter table public.match_players alter column status set default 'playing';

alter table public.room_players drop column character_id;
alter table public.room_players drop constraint room_players_seat_check;
alter table public.room_players add constraint room_players_seat_check check (seat between 1 and 8);

alter table public.game_rooms drop constraint game_rooms_ruleset2_two_players;
alter table public.game_rooms drop constraint game_rooms_max_players_check;
alter table public.game_rooms add constraint game_rooms_max_players_check check (max_players between 2 and 8);
alter table public.game_rooms drop constraint game_rooms_ruleset_version_check;
alter table public.game_rooms alter column ruleset_version set default '7';
alter table public.game_rooms add constraint game_rooms_ruleset_version_check check (ruleset_version = '7');

drop table if exists public.deck_template_cards;
drop table if exists public.deck_templates;
drop table if exists public.card_definitions;
drop table if exists public.characters;
