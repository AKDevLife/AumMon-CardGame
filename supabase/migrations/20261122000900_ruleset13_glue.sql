-- Task 12.21 — ruleset "13" (owner chose G2, 2026-11-22): Glue gives 1 card from your hand to a
-- chosen player. Active ruleset 12 matches are ended (kept as history).
update public.matches set status = 'abandoned', finished_at = now()
  where ruleset_version = '12' and status = 'active';
update public.game_rooms set status = 'closed'
  where ruleset_version = '12' and status <> 'closed';

alter table public.matches drop constraint matches_ruleset_check;
alter table public.matches add constraint matches_ruleset_check check (ruleset_version in ('7', '8', '9', '10', '11', '12', '13'));
alter table public.game_rooms drop constraint game_rooms_ruleset_version_check;
alter table public.game_rooms add constraint game_rooms_ruleset_version_check check (ruleset_version in ('7', '8', '9', '10', '11', '12', '13'));
alter table public.game_rooms alter column ruleset_version set default '13';
