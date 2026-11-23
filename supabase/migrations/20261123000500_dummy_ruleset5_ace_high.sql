-- Dummy ruleset "5" (owner 2026-11-23): 2 is the lowest card and the ace only high (Q-K-A; no A-2-3).
-- Active ruleset "4" games are ended (kept as history).
update public.matches set status = 'abandoned', finished_at = now()
  where game_id = 'dummy' and ruleset_version = '4' and status = 'active';
update public.game_rooms set status = 'closed'
  where game_id = 'dummy' and ruleset_version = '4' and status <> 'closed';
update public.games set current_ruleset = '5', updated_at = now() where id = 'dummy';
