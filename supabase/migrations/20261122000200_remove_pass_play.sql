-- Task 12.10 — owner 2026-11-22: Pass & Play removed (Online covers playing with friends).
-- No pass_play rooms or local seats exist (checked on Dev before applying); constraints are tightened only.
alter table public.game_rooms drop constraint game_rooms_mode_check;
alter table public.game_rooms add constraint game_rooms_mode_check check (mode in ('solo', 'online'));
alter table public.room_players drop constraint room_players_player_type_check;
alter table public.room_players add constraint room_players_player_type_check check (player_type in ('human', 'bot'));
alter table public.match_players drop constraint match_players_player_type_check;
alter table public.match_players add constraint match_players_player_type_check check (player_type in ('human', 'bot'));
