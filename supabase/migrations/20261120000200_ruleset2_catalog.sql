-- Task 8.9 — Ruleset 2 (1v1 TCG, aummon_game_spec.md v3.0) catalog + match columns.
-- Additive only: ruleset 1 rows and code paths keep working until task 8.14.
-- Card Definitions / Evolution Recipes / Fusion Recipes are separate tables (spec §3.3).
-- Card Instances + Match State live in private.match_runtime.internal_state (server only);
-- Match Events stay in public.match_events (public payloads only).

-- ---------------------------------------------------------------- card definitions

alter table public.card_definitions
  add column ruleset_version text not null default '1' check (ruleset_version in ('1','2')),
  add column rarity text check (rarity in ('normal','rare','super_rare')),
  add column stage smallint check (stage between 0 and 9),
  add column cost smallint check (cost between 1 and 8),
  add column atk smallint check (atk >= 0),
  add column hp smallint check (hp >= 0),
  add column traits text[] not null default '{}',
  add column keywords text[] not null default '{}'
    check (keywords <@ array['haste','guard','flying','piercing','boost']::text[]),
  add column slot_cost smallint not null default 0 check (slot_cost between 0 and 2),
  add column deckable boolean not null default true;

alter table public.card_definitions drop constraint card_definitions_card_type_check;
alter table public.card_definitions add constraint card_definitions_card_type_check check (
  (ruleset_version = '1' and card_type in ('attack','defense','support','chaos'))
  or (ruleset_version = '2' and card_type in ('unit','action','equipment','field')
      and rarity is not null and stage is not null and cost is not null
      and (card_type <> 'unit' or (atk is not null and hp > 0)))
);

alter table public.deck_templates
  add column ruleset_version text not null default '1' check (ruleset_version in ('1','2'));

-- ---------------------------------------------------------------- recipes (spec §6.5)

create table public.evolution_recipes (
  id text primary key,
  source_card_id text not null references public.card_definitions(id),
  target_card_id text not null references public.card_definitions(id),
  required_stage smallint not null check (required_stage >= 0),
  required_trait text not null,
  cost smallint not null check (cost between 1 and 8),
  equipment_policy text not null default 'keep_compatible' check (equipment_policy = 'keep_compatible'),
  recipe_version text not null,
  is_enabled boolean not null default true,
  check (source_card_id <> target_card_id),
  unique (source_card_id)
);

create table public.fusion_recipes (
  id text primary key,
  parent_a_card_id text not null references public.card_definitions(id),
  parent_b_card_id text not null references public.card_definitions(id),
  result_card_id text not null references public.card_definitions(id),
  cost smallint not null check (cost between 1 and 8),
  inherited_keywords text[] not null default '{}'
    check (cardinality(inherited_keywords) <= 2),
  recipe_version text not null,
  is_enabled boolean not null default true,
  check (parent_a_card_id <> parent_b_card_id)
);

grant select on public.evolution_recipes, public.fusion_recipes to authenticated;
alter table public.evolution_recipes enable row level security;
alter table public.fusion_recipes enable row level security;

create policy "authenticated read enabled evolution recipes"
on public.evolution_recipes for select to authenticated using (is_enabled);
create policy "authenticated read enabled fusion recipes"
on public.fusion_recipes for select to authenticated using (is_enabled);

-- ---------------------------------------------------------------- matches (1v1, no characters)

alter table public.matches drop constraint matches_phase_check;
alter table public.matches add constraint matches_phase_check
  check (phase in ('setup','draw','turn_start','select','resolving','end','mulligan','main','battle'));

alter table public.match_players
  alter column character_id drop not null,
  alter column character_snapshot drop not null,
  alter column speed drop not null;
