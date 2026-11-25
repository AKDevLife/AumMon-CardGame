-- v2 (15.11 S3–S5): content is server-only, BLUFF registered, guest helper, room settings.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('private', 'content_items', 'content_items exists');
select ok(not has_table_privilege('authenticated', 'private.content_items', 'select'),
  'clients cannot read content');
select ok(not has_table_privilege('anon', 'private.content_items', 'select'), 'anon cannot read content');
select ok(not has_table_privilege('authenticated', 'private.content_reports', 'insert'),
  'clients cannot write reports directly');
select is((select count(*)::int from private.content_items where game_id = 'bluff'), 150,
  'BLUFF Thai pack v1 seeded');
select is((select count(*)::int from private.content_items where status <> 'draft'), 0,
  'seed waits for owner review (draft)');
select is((select current_ruleset from public.games where id = 'bluff'), '2', 'BLUFF ruleset 2');
select throws_ok($$insert into private.content_items (id, game_id, category, humor, body)
  values ('bad-one', 'bluff', 'food', 1, '{"prompt":"ทดสอบคำถาม","options":["a","a","b","c"]}')$$,
  '23514', null, 'BLUFF options must be 4 distinct');
select col_default_is('public', 'game_rooms', 'settings', '''{}''::jsonb', 'room settings default {}');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","is_anonymous":true}';
select ok(public.is_guest(), 'is_guest() true for anonymous JWT');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","is_anonymous":false}';
select ok(not public.is_guest(), 'is_guest() false for accounts');
reset role;

select * from finish();
rollback;
