-- AumMon task 6.3 — private Realtime channels (Broadcast/Presence) for match members only.
-- Topic format: match:<uuid>. Applied only where the Realtime schema exists
-- (Supabase hosted/local); plain Postgres test containers skip it.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute $p$
      create policy "match members use private match channel"
      on realtime.messages for all to authenticated
      using (
        realtime.topic() ~ '^match:[0-9a-f-]{36}$'
        and public.is_match_member(substring(realtime.topic() from 7)::uuid)
      )
      with check (
        realtime.topic() ~ '^match:[0-9a-f-]{36}$'
        and public.is_match_member(substring(realtime.topic() from 7)::uuid)
      )
    $p$;
  end if;
end $$;
