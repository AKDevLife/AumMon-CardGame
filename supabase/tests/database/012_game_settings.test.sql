-- Task 9.11 — game settings: players read, never write.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into public.game_settings (key, value) values ('sounds', '{"attack":{"preset":"laser","volume":1,"enabled":true}}');
set local role authenticated;
select is((select count(*)::int from public.game_settings), 1, 'authenticated can read settings');
select throws_ok($$insert into public.game_settings (key, value) values ('x', '{}')$$, '42501', null, 'cannot insert');
select throws_ok($$update public.game_settings set value = '{}'$$, '42501', null, 'cannot update');
reset role;
set local role anon;
select throws_ok($$select * from public.game_settings$$, '42501', null, 'anon cannot read');
reset role;

select * from finish();
rollback;
