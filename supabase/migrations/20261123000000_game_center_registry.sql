-- Game Center GC1.3 (docs/architecture/DATABASE_EVOLUTION_PLAN.md M1–M5).
-- Additive only: existing rooms and matches become game 'edo_battle' through the column default.

create table public.games (
  id text primary key check (id ~ '^[a-z_]{2,32}$'),
  display_name_th text not null check (char_length(display_name_th) between 1 and 40),
  display_name_en text not null check (char_length(display_name_en) between 1 and 40),
  is_enabled boolean not null default false,
  min_players smallint not null check (min_players >= 2),
  max_players smallint not null check (max_players <= 8),
  current_ruleset text not null check (current_ruleset ~ '^[0-9]{1,4}$'),
  sort_order smallint not null default 0,
  updated_at timestamptz not null default now(),
  check (min_players <= max_players)
);

insert into public.games (id, display_name_th, display_name_en, is_enabled, min_players, max_players, current_ruleset, sort_order)
values
  ('edo_battle', 'EDO Battle', 'EDO Battle', true, 2, 8, '13', 1),
  ('dummy', 'ดัมมี่', 'Dummy', true, 2, 4, '1', 2),
  ('poker', 'โป๊กเกอร์', 'Poker', true, 2, 8, '1', 3);

alter table public.games enable row level security;
grant select on public.games to authenticated;
grant select, insert, update, delete on public.games to service_role;
create policy "authenticated read enabled games"
on public.games for select to authenticated using (is_enabled);

-- M2: game id on rooms and matches.
alter table public.game_rooms add column game_id text not null default 'edo_battle' references public.games(id);
alter table public.matches add column game_id text not null default 'edo_battle' references public.games(id);
create index game_rooms_game_status_idx on public.game_rooms(game_id, status);
create index matches_game_status_idx on public.matches(game_id, status);

-- M3: ruleset versions are per game (EDO keeps its exact list).
alter table public.matches drop constraint matches_ruleset_check;
alter table public.matches add constraint matches_ruleset_check check (
  (game_id = 'edo_battle' and ruleset_version in ('7', '8', '9', '10', '11', '12', '13'))
  or (game_id <> 'edo_battle' and ruleset_version ~ '^[0-9]{1,4}$'));
alter table public.game_rooms drop constraint game_rooms_ruleset_version_check;
alter table public.game_rooms add constraint game_rooms_ruleset_version_check check (
  (game_id = 'edo_battle' and ruleset_version in ('7', '8', '9', '10', '11', '12', '13'))
  or (game_id <> 'edo_battle' and ruleset_version ~ '^[0-9]{1,4}$'));

-- M4: phase values are per game.
alter table public.matches drop constraint matches_phase_check;
alter table public.matches add constraint matches_phase_check check (
  (game_id = 'edo_battle' and phase in ('play', 'reaction', 'finished'))
  or (game_id <> 'edo_battle' and phase ~ '^[a-z_]{1,24}$'));

-- M5: platform Quick Match (automatic matchmaking) rooms.
alter table public.game_rooms drop constraint game_rooms_mode_check;
alter table public.game_rooms add constraint game_rooms_mode_check check (mode in ('solo', 'online', 'quick_match'));
