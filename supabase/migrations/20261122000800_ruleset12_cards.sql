-- Task 12.20 — ruleset "12" (owner 2026-11-22): Flashlight = see one opponent's whole hand (private);
-- Magnifier = see the top 2 cards of the draw pile (private); Fan = reverse only; Alarm Clock = the
-- player with the fewest cards draws 1. Active ruleset 11 matches are ended (kept as history).
update public.matches set status = 'abandoned', finished_at = now()
  where ruleset_version = '11' and status = 'active';
update public.game_rooms set status = 'closed'
  where ruleset_version = '11' and status <> 'closed';

alter table public.matches drop constraint matches_ruleset_check;
alter table public.matches add constraint matches_ruleset_check check (ruleset_version in ('7', '8', '9', '10', '11', '12'));
alter table public.game_rooms drop constraint game_rooms_ruleset_version_check;
alter table public.game_rooms add constraint game_rooms_ruleset_version_check check (ruleset_version in ('7', '8', '9', '10', '11', '12'));
alter table public.game_rooms alter column ruleset_version set default '12';
