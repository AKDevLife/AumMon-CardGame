-- Task 7.2 — metrics are server-only and summaries compute.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);
select ok(not has_table_privilege('authenticated', 'private.function_metrics', 'select'), 'clients cannot read metrics');
select ok(not has_table_privilege('anon', 'private.metrics_functions_24h', 'select'), 'anon cannot read summaries');
insert into private.function_metrics (function_name, status, error_code, duration_ms) values
  ('matches-view', 200, null, 40), ('matches-view', 200, null, 60), ('matches-submit-action', 409, 'wrong_round', 80), ('rooms-join', 429, 'rate_limited', 5);
select results_eq(
  $$select function_name, requests::int, rejected_commands::int, rate_limited::int from private.metrics_functions_24h order by 1$$,
  $$values ('matches-submit-action', 1, 1, 0), ('matches-view', 2, 0, 0), ('rooms-join', 1, 0, 1)$$,
  'per-function counts');
select is((select p50_ms from private.metrics_functions_24h where function_name = 'matches-view'), 50, 'p50 latency');
select * from finish();
rollback;
