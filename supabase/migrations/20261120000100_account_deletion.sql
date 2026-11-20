-- AumMon task 7.4 — account deletion keeps match history but removes the link
-- to the person (blueprint §3.5: anonymize records that must be kept).
-- A human seat with user_id = null means "deleted account".

alter table public.game_rooms alter column owner_id drop not null;
alter table public.game_rooms drop constraint game_rooms_owner_id_fkey,
  add constraint game_rooms_owner_id_fkey foreign key (owner_id) references auth.users(id) on delete set null;

alter table public.room_players drop constraint room_players_user_id_fkey,
  add constraint room_players_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.room_players drop constraint room_players_check,
  add constraint room_players_check check (player_type = 'human' or user_id is null);

alter table public.match_players drop constraint match_players_user_id_fkey,
  add constraint match_players_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.match_players drop constraint match_players_check,
  add constraint match_players_check check (player_type = 'human' or user_id is null);

alter table private.command_receipts drop constraint command_receipts_actor_user_id_fkey,
  add constraint command_receipts_actor_user_id_fkey foreign key (actor_user_id) references auth.users(id) on delete cascade;

-- Name shown in history after deletion.
create or replace function private.anonymize_deleted_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.room_players set display_name_snapshot = 'ผู้เล่นที่ลบบัญชี' where user_id = old.id;
  return old;
end;
$$;
alter function private.anonymize_deleted_user() owner to postgres;
revoke all on function private.anonymize_deleted_user() from public, anon, authenticated;

create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute function private.anonymize_deleted_user();
