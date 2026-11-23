-- Game Center GC2.6 / GC2.7 / GC4.4 (docs/architecture/DATABASE_EVOLUTION_PLAN.md M7, M8, M14).
-- Additive only.

-- M8: per-game player stats (owner reads own rows; written by Edge Functions on match end).
create table public.player_game_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id),
  played integer not null default 0 check (played >= 0),
  won integer not null default 0 check (won >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id),
  check (won <= played)
);
alter table public.player_game_stats enable row level security;
grant select on public.player_game_stats to authenticated;
grant select, insert, update, delete on public.player_game_stats to service_role;
create policy "users read own game stats"
on public.player_game_stats for select to authenticated
using (user_id = (select auth.uid()));

-- Backfill EDO Battle history (finished matches, human seats still linked to a user).
insert into public.player_game_stats (user_id, game_id, played, won)
select mp.user_id, m.game_id, count(*), count(*) filter (where mp.status = 'won')
from public.match_players mp
join public.matches m on m.id = mp.match_id
where m.status = 'finished' and mp.user_id is not null and mp.player_type = 'human'
group by mp.user_id, m.game_id
on conflict (user_id, game_id) do nothing;

-- M7: Quick Match queue (private; Edge Functions only).
create table private.matchmaking_queue (
  user_id uuid primary key references auth.users(id) on delete cascade,
  game_id text not null references public.games(id),
  players smallint not null check (players between 2 and 8),
  status text not null default 'waiting' check (status in ('waiting', 'matched')),
  match_id uuid references public.matches(id) on delete set null,
  enqueued_at timestamptz not null default now()
);
create index matchmaking_queue_waiting_idx
  on private.matchmaking_queue (game_id, players, enqueued_at) where status = 'waiting';
revoke all on private.matchmaking_queue from public, anon, authenticated;
grant select, insert, update, delete on private.matchmaking_queue to service_role;

-- M14: private realtime topic for lobbies (room members only).
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute $p$
      create policy "room members use private room channel"
      on realtime.messages for all to authenticated
      using (
        realtime.topic() ~ '^room:[0-9a-f-]{36}$'
        and public.is_room_member(substring(realtime.topic() from 6)::uuid)
      )
      with check (
        realtime.topic() ~ '^room:[0-9a-f-]{36}$'
        and public.is_room_member(substring(realtime.topic() from 6)::uuid)
      )
    $p$;
  end if;
end $$;
