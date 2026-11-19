-- AumMon task 2.2 — profile auto-creation and updated_at triggers (blueprint §3.4 notes).

-- ------------------------------------------------------------ updated_at
-- Only public.profiles has an updated_at column (blueprint §3.4).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------ profile on signup
-- SECURITY DEFINER is required: the auth service inserts into auth.users and has no
-- rights on public.profiles. Hardened: empty search_path, schema-qualified names,
-- lives in the non-exposed private schema, EXECUTE revoked from client roles.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    case
      when char_length(requested) between 2 and 24 then requested
      else 'Player-' || left(replace(new.id::text, '-', ''), 6)
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

alter function private.handle_new_user() owner to postgres;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
