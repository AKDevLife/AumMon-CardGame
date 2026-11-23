-- Dummy ruleset "3" (owner 2026-11-23): ทิ้งเต็ม — a discard that completes a set or run with any
-- two cards already in the pile costs 50 (speto 100). Active ruleset "2" games are ended (kept as history).
update public.matches set status = 'abandoned', finished_at = now()
  where game_id = 'dummy' and ruleset_version = '2' and status = 'active';
update public.game_rooms set status = 'closed'
  where game_id = 'dummy' and ruleset_version = '2' and status <> 'closed';
update public.games set current_ruleset = '3', updated_at = now() where id = 'dummy';
