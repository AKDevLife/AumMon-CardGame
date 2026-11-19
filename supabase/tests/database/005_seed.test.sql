-- Task 2.5 — seed matches spec §2/§3, Rule 8 and clarification Q1.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select results_eq(
  $$select id, base_hp::int, speed, hook, effect_key from public.characters
    where id in ('pyro_pup','aqua_otter','breeze_kit','terra_tortoise') order by id$$,
  $$values ('aqua_otter', 3, 60, 'onTurnStart', 'SWAP_CARD_ONCE'),
           ('breeze_kit', 3, 90, 'onBeforeDamaged', 'DISCARD_TO_DODGE'),
           ('pyro_pup', 3, 70, 'onAttack', 'BONUS_DMG_FIRST_HIT'),
           ('terra_tortoise', 4, 40, 'onBeforeDamaged', 'REDUCE_DMG_1')$$,
  'four starter characters match spec §3');

select is((select count(*)::int from public.deck_templates where id = 'standard' and is_active), 1, 'standard deck v1 active');
select is((select sum(quantity)::int from public.deck_template_cards where deck_template_id = 'standard' and deck_template_version = 1),
  40, 'deck has 40 cards (Rule 8)');

select is((select sum(t.quantity)::int from public.deck_template_cards t join public.card_definitions c on c.id = t.card_definition_id
  where t.deck_template_id = 'standard' and c.card_type = x.k), x.n, 'deck has ' || x.n || ' ' || x.k)
from (values ('attack', 16), ('defense', 10), ('support', 8), ('chaos', 6)) as x(k, n);

select results_eq(
  $$select card_definition_id, quantity from public.deck_template_cards
    where deck_template_id = 'standard' and card_definition_id like 'chaos_%' order by 1$$,
  $$values ('chaos_aoe', 2), ('chaos_disrupt', 2), ('chaos_redirect', 2)$$,
  'chaos split 2/2/2 (clarification Q1)');

select is((select count(*)::int from public.characters where is_enabled), 4, 'only seeded characters are enabled');

select * from finish();
rollback;
