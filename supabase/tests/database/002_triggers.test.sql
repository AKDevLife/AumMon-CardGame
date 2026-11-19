-- Task 2.2 — profile auto-creation, duplicate protection, updated_at, trigger security.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Security of the definer function
select ok((select prosecdef from pg_proc where oid = 'private.handle_new_user()'::regprocedure),
  'handle_new_user is SECURITY DEFINER');
select ok((select 'search_path=""' = any(proconfig) from pg_proc where oid = 'private.handle_new_user()'::regprocedure),
  'handle_new_user pins empty search_path');
select ok((select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.set_updated_at()'::regprocedure),
  'set_updated_at pins empty search_path');
select ok(not (select prosecdef from pg_proc where oid = 'public.set_updated_at()'::regprocedure),
  'set_updated_at is SECURITY INVOKER');
select ok(not has_function_privilege('anon', 'private.handle_new_user()', 'execute'), 'anon cannot execute handle_new_user');
select ok(not has_function_privilege('authenticated', 'private.handle_new_user()', 'execute'), 'authenticated cannot execute handle_new_user');
select ok(not has_function_privilege('authenticated', 'public.set_updated_at()', 'execute'), 'authenticated cannot execute set_updated_at');

-- Profile creation
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local', '{"display_name":"  Aum  "}'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@test.local', '{}'),
  ('00000000-0000-0000-0000-0000000000c3', 'c@test.local', '{"display_name":"x"}'),
  ('00000000-0000-0000-0000-0000000000d4', 'd@test.local', '{"display_name":"abcdefghijklmnopqrstuvwxyz"}');

select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'Aum', 'profile created with trimmed display_name');
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'),
  'Player-000000', 'missing display_name falls back to Player-<id>');
select is((select count(*)::int from public.profiles where id in
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000d4') and display_name like 'Player-%'),
  2, 'too short / too long display_name falls back');

-- Duplicate protection
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), 1,
  'exactly one profile per user');
select throws_ok($$insert into public.profiles (id, display_name) values ('00000000-0000-0000-0000-0000000000a1', 'Dup')$$,
  '23505', null, 'duplicate profile rejected');

-- updated_at
update public.profiles set updated_at = '2000-01-01' where id = '00000000-0000-0000-0000-0000000000a1';
select is((select updated_at from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), now(),
  'updated_at set by trigger (client value ignored)');
select is((select created_at from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), now(),
  'created_at unchanged by update');

select * from finish();
rollback;
