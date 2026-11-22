-- Task 12.14 — ruleset "9" (owner approved Q1 + Q4 on 2026-11-22): Key 6, Umbrella 7,
-- Trash without redraw, Flashlight reveal 3 s. Active ruleset 8 matches are ended (kept as history).
update public.matches set status = 'abandoned', finished_at = now()
  where ruleset_version = '8' and status = 'active';
update public.game_rooms set status = 'closed'
  where ruleset_version = '8' and status <> 'closed';

alter table public.matches drop constraint matches_ruleset_check;
alter table public.matches add constraint matches_ruleset_check check (ruleset_version in ('7', '8', '9'));
alter table public.game_rooms drop constraint game_rooms_ruleset_version_check;
alter table public.game_rooms add constraint game_rooms_ruleset_version_check check (ruleset_version in ('7', '8', '9'));
alter table public.game_rooms alter column ruleset_version set default '9';
