-- Product Direction v2 (owner 2026-11-25): Dummy and Poker are retired. Forward-only and non-destructive:
-- the games are switched off, open rooms closed and running matches ended; all rows stay as history.
update public.games set is_enabled = false, updated_at = now() where id in ('dummy', 'poker');
update public.matches set status = 'abandoned', finished_at = now()
  where game_id in ('dummy', 'poker') and status = 'active';
update public.game_rooms set status = 'closed'
  where game_id in ('dummy', 'poker') and status <> 'closed';
