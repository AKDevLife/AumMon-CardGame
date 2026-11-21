-- Task 11.4 — ruleset 5 catalog (Everyday Objects), starter deck, RLS; recipes removed.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select is((select count(*)::int from public.card_definitions where ruleset_version = '5'), 24, '24 ruleset 5 Objects');
select is((select count(*)::int from public.card_definitions where ruleset_version = '5' and card_type <> 'unit'), 0, 'Objects only');
select is((select sum(quantity)::int from public.deck_template_cards where deck_template_id = 'starter_v5'), 30, 'starter deck 30 cards');
select ok((select max(quantity) <= 3 from public.deck_template_cards where deck_template_id = 'starter_v5'), 'max 3 copies');
select is((select ruleset_version from public.deck_templates where id = 'starter_v5' and is_active), '5', 'starter_v5 active');
select hasnt_table('public', 'evolution_recipes', 'evolution recipes removed');
select hasnt_table('public', 'fusion_recipes', 'fusion recipes removed');

select throws_ok($$insert into public.card_definitions (id, name, card_type, description, ruleset_version)
  values ('bad', 'Bad', 'unit', '', '5')$$, '23514', null, 'ruleset 5 Object needs stats');

set local role authenticated;
select is((select count(*)::int from public.card_definitions where ruleset_version = '5'), 24, 'authenticated reads Objects');
reset role;

select * from finish();
rollback;
