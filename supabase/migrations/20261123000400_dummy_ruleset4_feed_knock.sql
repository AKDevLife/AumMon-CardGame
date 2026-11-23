-- Dummy ruleset "4" (owner 2026-11-23): ทิ้งโง่ only when the next player picks just my last discard,
-- melds it and knocks in that turn (−50, speto −100). Active ruleset "3" games are ended (kept as history).
update public.matches set status = 'abandoned', finished_at = now()
  where game_id = 'dummy' and ruleset_version = '3' and status = 'active';
update public.game_rooms set status = 'closed'
  where game_id = 'dummy' and ruleset_version = '3' and status <> 'closed';
update public.games set current_ruleset = '4', updated_at = now() where id = 'dummy';
