-- Dummy ruleset "2" (owner 2026-11-23): ทิ้งโง่ — a discard another player picks up before the
-- discarder's next turn costs the discarder 50 (speto 100). Active ruleset "1" games are ended (kept as history).
update public.matches set status = 'abandoned', finished_at = now()
  where game_id = 'dummy' and ruleset_version = '1' and status = 'active';
update public.game_rooms set status = 'closed'
  where game_id = 'dummy' and ruleset_version = '1' and status <> 'closed';
update public.games set current_ruleset = '2', updated_at = now() where id = 'dummy';
