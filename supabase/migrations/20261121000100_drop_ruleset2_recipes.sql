-- Task 10.5 — ruleset 2 removed (owner decision R3, 2026-11-21): no Evolution / Fusion in ruleset 3.
-- Recipe tables have no history references and are dropped. Ruleset 2 card / deck rows stay
-- (inactive) because finished matches reference them (history is kept).
drop table if exists public.evolution_recipes;
drop table if exists public.fusion_recipes;
