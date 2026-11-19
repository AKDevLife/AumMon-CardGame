-- AumMon task 2.4 — RLS policies (blueprint §4.2–4.4). Read-only for clients;
-- all game-state writes go through server code (service_role bypasses RLS).

-- ------------------------------------------------------------ membership helpers
-- SECURITY DEFINER avoids policy recursion between rooms/players tables.
-- Hardened per §4.2.6: empty search_path, schema-qualified names, EXECUTE only for authenticated.

create or replace function public.is_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.matches m
    join public.game_rooms r on r.id = m.room_id
    where m.id = p_match_id
      and (
        r.owner_id = (select auth.uid())
        or exists (
          select 1 from public.match_players mp
          where mp.match_id = m.id
            and mp.user_id = (select auth.uid())
        )
      )
  );
$$;

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.game_rooms r
    where r.id = p_room_id
      and (
        r.owner_id = (select auth.uid())
        or exists (
          select 1 from public.room_players rp
          where rp.room_id = r.id
            and rp.user_id = (select auth.uid())
        )
      )
  );
$$;

revoke all on function public.is_match_member(uuid) from public, anon;
revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_match_member(uuid) to authenticated;
grant execute on function public.is_room_member(uuid) to authenticated;

-- ------------------------------------------------------------ profiles (own row only)

create policy "users read own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "users update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- ------------------------------------------------------------ definitions (read-only)

create policy "authenticated read enabled characters"
on public.characters for select to authenticated
using (is_enabled);

create policy "authenticated read enabled cards"
on public.card_definitions for select to authenticated
using (is_enabled);

create policy "authenticated read deck templates"
on public.deck_templates for select to authenticated
using (true);

create policy "authenticated read deck template cards"
on public.deck_template_cards for select to authenticated
using (true);

-- ------------------------------------------------------------ rooms & matches (members only)

create policy "room members read room"
on public.game_rooms for select to authenticated
using ((select public.is_room_member(id)));

create policy "room members read seats"
on public.room_players for select to authenticated
using ((select public.is_room_member(room_id)));

create policy "match members read match"
on public.matches for select to authenticated
using ((select public.is_match_member(id)));

create policy "match members read player state"
on public.match_players for select to authenticated
using ((select public.is_match_member(match_id)));

create policy "match members read public events"
on public.match_events for select to authenticated
using ((select public.is_match_member(match_id)));
