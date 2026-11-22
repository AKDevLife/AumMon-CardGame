-- Task 12.16 — playtest telemetry (owner Q3): one private row per match, written by the server only.
-- Never exposed through the API (private schema); no names or user ids; opening hands are card ids only
-- and are read back only as aggregates (admin-api `stats`).
create table private.round_stats (
  match_id uuid primary key references public.matches(id) on delete cascade,
  ruleset_version text not null,
  mode text not null,
  players smallint not null,
  humans smallint not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  turns integer not null default 0,
  timeouts integer not null default 0,
  decisions integer not null default 0,
  decision_ms bigint not null default 0,
  drawn_plays integer not null default 0,
  abilities jsonb not null default '{}'::jsonb,
  opening jsonb not null,
  winner_seat smallint,
  winner_kind text,
  rematch boolean not null default false,
  left_early integer not null default 0
);
create index round_stats_started_idx on private.round_stats (started_at desc);
revoke all on private.round_stats from public, anon, authenticated;
