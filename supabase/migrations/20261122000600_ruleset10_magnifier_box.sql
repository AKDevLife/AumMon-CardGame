-- Task 12.17 — ruleset "10" (owner delegated the decision to Claude, 2026-11-22):
-- Magnifier peek + play 1 more card; Box puts 1 extra card of 1–3 points on the pile.
-- Active ruleset 9 matches are ended (kept as history).
update public.matches set status = 'abandoned', finished_at = now()
  where ruleset_version = '9' and status = 'active';
update public.game_rooms set status = 'closed'
  where ruleset_version = '9' and status <> 'closed';

alter table public.matches drop constraint matches_ruleset_check;
alter table public.matches add constraint matches_ruleset_check check (ruleset_version in ('7', '8', '9', '10'));
alter table public.game_rooms drop constraint game_rooms_ruleset_version_check;
alter table public.game_rooms add constraint game_rooms_ruleset_version_check check (ruleset_version in ('7', '8', '9', '10'));
alter table public.game_rooms alter column ruleset_version set default '10';
