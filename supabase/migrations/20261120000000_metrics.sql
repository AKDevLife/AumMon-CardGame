-- AumMon task 7.2 — lightweight, no-cost monitoring (blueprint §11.4).
-- Request metrics are written by Edge Functions (server only); summaries are
-- read by the owner in the Supabase SQL editor. No PII or game secrets stored.

create table private.function_metrics (
  id bigint generated always as identity primary key,
  function_name text not null,
  status smallint not null,
  error_code text,
  duration_ms integer not null,
  created_at timestamptz not null default now()
);
create index function_metrics_time_idx on private.function_metrics(created_at);
revoke all on private.function_metrics from public, anon, authenticated;
grant select, insert, delete on private.function_metrics to service_role;

-- Per-function latency and error rate, last 24 hours.
create view private.metrics_functions_24h as
select
  function_name,
  count(*) as requests,
  round(percentile_cont(0.5) within group (order by duration_ms))::int as p50_ms,
  round(percentile_cont(0.95) within group (order by duration_ms))::int as p95_ms,
  round(percentile_cont(0.99) within group (order by duration_ms))::int as p99_ms,
  count(*) filter (where status >= 500) as server_errors,
  count(*) filter (where status = 429) as rate_limited,
  count(*) filter (where status = 409) as rejected_commands
from private.function_metrics
where created_at > now() - interval '24 hours'
group by function_name;

-- Match activity per day (created / finished / abandoned / active, avg duration).
create view private.metrics_matches_daily as
select
  date_trunc('day', created_at) as day,
  count(*) as created,
  count(*) filter (where status = 'finished') as finished,
  count(*) filter (where status = 'abandoned') as abandoned,
  count(*) filter (where status = 'active') as active,
  round(avg(extract(epoch from finished_at - started_at)) filter (where finished_at is not null))::int as avg_duration_s
from public.matches
group by 1
order by 1 desc;

revoke all on private.metrics_functions_24h, private.metrics_matches_daily from public, anon, authenticated;
grant select on private.metrics_functions_24h, private.metrics_matches_daily to service_role;
