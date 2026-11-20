-- Task 8.9 — ruleset 2 catalog, recipes, starter deck, RLS.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select is((select count(*)::int from public.card_definitions where ruleset_version = '2'), 25, '25 ruleset 2 cards');
select is((select count(*)::int from public.card_definitions where ruleset_version = '2' and card_type = 'unit'), 19, '19 units');
select is((select count(*)::int from public.evolution_recipes), 8, '8 evolution recipes');
select is((select count(*)::int from public.fusion_recipes), 3, '3 fusion recipes');
select is((select sum(quantity)::int from public.deck_template_cards where deck_template_id = 'starter_v2'), 30, 'starter deck 30 cards');
select is((select max(quantity)::int from public.deck_template_cards where deck_template_id = 'starter_v2'), 3, 'max 3 copies');
select is((select count(*)::int from public.deck_template_cards t join public.card_definitions c on c.id = t.card_definition_id
  where t.deck_template_id = 'starter_v2' and not c.deckable), 0, 'starter deck has only deckable cards');
select is((select ruleset_version from public.deck_templates where id = 'starter_v2' and is_active), '2', 'starter_v2 active for ruleset 2');

select throws_ok($$insert into public.card_definitions (id, name, card_type, description, ruleset_version)
  values ('bad', 'Bad', 'unit', '', '2')$$, '23514', null, 'ruleset 2 unit needs stats');

set local role authenticated;
select is((select count(*)::int from public.evolution_recipes), 8, 'authenticated reads evolution recipes');
select throws_ok($$insert into public.fusion_recipes (id, parent_a_card_id, parent_b_card_id, result_card_id, cost, recipe_version)
  values ('x', 'U001_RUBBER_DUCKLING', 'U002_TIN_CAN_GUARDIAN', 'U201_AMPHIBIOUS_GLIDER', 1, '1')$$, '42501', null,
  'authenticated cannot write recipes');
reset role;

set local role anon;
select throws_ok($$select count(*) from public.fusion_recipes$$, '42501', null, 'anon cannot read recipes');
reset role;

select * from finish();
rollback;
