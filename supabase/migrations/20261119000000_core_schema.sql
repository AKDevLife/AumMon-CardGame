-- AumMon core schema (task 2.1) — based on aummon_project_blueprint.md §3.4.
-- Deviations from the blueprint DDL (see docs/DEVELOPMENT_CHANGELOG.md):
--   * deck_templates PK is (id, version) so multiple versions can exist (§13: "Deck Template Version");
--     deck_template_cards and matches reference the composite key.
--   * Unique character per room / match (clarification Q10).
--   * match_players gets the same player_type/user_id check as room_players (§3.4 notes).
--   * private schema: explicit service_role grants (server only).
-- Not in this migration: RLS policies (2.4), triggers (2.2), seed data (2.5).

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

-- Never expose the private schema through the Data API (config.toml api.schemas).
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

-- ---------------------------------------------------------------- public: definitions

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.characters (
  id text primary key,
  name text not null,
  element text not null,
  base_hp smallint not null check (base_hp > 0),
  speed integer not null,
  hook text not null check (hook in ('onTurnStart','onAttack','onBeforeDamaged','onAfterDamaged','onRoundEnd')),
  effect_key text not null,
  description text not null,
  definition_version integer not null default 1,
  is_enabled boolean not null default true
);

create table public.card_definitions (
  id text primary key,
  name text not null,
  card_type text not null check (card_type in ('attack','defense','support','chaos')),
  description text not null,
  effect_spec jsonb not null default '{}'::jsonb,
  definition_version integer not null default 1,
  is_enabled boolean not null default true
);

create table public.deck_templates (
  id text not null,
  version integer not null check (version > 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (id, version)
);
create unique index deck_templates_one_active
  on public.deck_templates(id) where is_active;

create table public.deck_template_cards (
  deck_template_id text not null,
  deck_template_version integer not null,
  card_definition_id text not null references public.card_definitions(id),
  quantity integer not null check (quantity > 0),
  primary key (deck_template_id, deck_template_version, card_definition_id),
  foreign key (deck_template_id, deck_template_version)
    references public.deck_templates(id, version) on delete cascade
);

-- ---------------------------------------------------------------- public: rooms & matches

create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  join_code_hash text unique,
  mode text not null check (mode in ('solo','pass_play','online')),
  status text not null default 'lobby' check (status in ('lobby','playing','closed')),
  max_players smallint not null default 4 check (max_players between 2 and 4),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid references auth.users(id),
  seat smallint not null check (seat between 1 and 4),
  player_type text not null check (player_type in ('human','bot','local')),
  character_id text not null references public.characters(id),
  display_name_snapshot text not null,
  status text not null default 'waiting' check (status in ('waiting','ready','disconnected','left')),
  created_at timestamptz not null default now(),
  unique (room_id, seat),
  unique (room_id, character_id),
  check ((player_type = 'human' and user_id is not null) or (player_type in ('bot','local') and user_id is null))
);
create unique index room_one_seat_per_user
  on public.room_players(room_id, user_id) where user_id is not null;

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id),
  deck_template_id text not null,
  deck_template_version integer not null,
  status text not null default 'created' check (status in ('created','active','finished','abandoned')),
  phase text not null default 'setup' check (phase in ('setup','draw','select','resolving','end')),
  round_number integer not null default 0 check (round_number >= 0),
  version bigint not null default 0 check (version >= 0),
  engine_version text not null,
  ruleset_version text not null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (deck_template_id, deck_template_version)
    references public.deck_templates(id, version)
);

create table public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  room_player_id uuid references public.room_players(id),
  user_id uuid references auth.users(id),
  seat smallint not null check (seat between 1 and 4),
  player_type text not null check (player_type in ('human','bot','local')),
  character_id text not null,
  character_snapshot jsonb not null,
  hp smallint not null,
  max_hp smallint not null check (max_hp > 0),
  speed integer not null,
  status text not null default 'alive' check (status in ('alive','eliminated','surrendered')),
  unique (match_id, seat),
  unique (match_id, character_id),
  unique (id, match_id),
  check ((player_type = 'human' and user_id is not null) or (player_type in ('bot','local') and user_id is null))
);

create table public.match_events (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  event_seq bigint not null,
  round_number integer not null,
  event_type text not null,
  public_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (match_id, event_seq)
);

-- ---------------------------------------------------------------- private (server only)

create table private.match_runtime (
  match_id uuid primary key references public.matches(id) on delete cascade,
  rng_state bytea not null,
  resolution_token uuid,
  resolution_lease_until timestamptz,
  internal_state jsonb not null default '{}'::jsonb
);

create table private.match_cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  card_definition_id text not null,
  card_snapshot jsonb not null,
  zone text not null check (zone in ('deck','hand','discard')),
  owner_match_player_id uuid,
  position integer,
  unique (id, match_id),
  foreign key (owner_match_player_id, match_id)
    references public.match_players(id, match_id),
  check ((zone = 'hand' and owner_match_player_id is not null) or (zone in ('deck','discard') and owner_match_player_id is null))
);

create table private.match_player_runtime (
  match_player_id uuid primary key references public.match_players(id) on delete cascade,
  skill_state jsonb not null default '{}'::jsonb
);

create table private.round_submissions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  round_number integer not null,
  match_player_id uuid not null,
  card_instance_id uuid not null,
  target_match_player_id uuid,
  choice text,
  idempotency_key uuid not null,
  submitted_at timestamptz not null default now(),
  unique (match_id, round_number, match_player_id),
  unique (match_id, idempotency_key),
  foreign key (match_player_id, match_id)
    references public.match_players(id, match_id),
  foreign key (target_match_player_id, match_id)
    references public.match_players(id, match_id),
  foreign key (card_instance_id, match_id)
    references private.match_cards(id, match_id)
);

create table private.command_receipts (
  match_id uuid not null references public.matches(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  request_hash text not null,
  response_payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (match_id, actor_user_id, idempotency_key)
);

-- ---------------------------------------------------------------- indexes

create index room_players_room_idx on public.room_players(room_id);
create index matches_room_idx on public.matches(room_id);
create index match_players_user_idx on public.match_players(user_id);
create index match_cards_hand_idx on private.match_cards(match_id, owner_match_player_id) where zone = 'hand';
create index round_submissions_round_idx on private.round_submissions(match_id, round_number);
-- match_events(match_id, event_seq) is already indexed by its unique constraint.

-- ---------------------------------------------------------------- privileges & RLS

revoke all on all tables in schema private from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema private to service_role;

-- RLS on every exposed table. No policies yet (task 2.4) => deny-all for anon/authenticated.
alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.card_definitions enable row level security;
alter table public.deck_templates enable row level security;
alter table public.deck_template_cards enable row level security;
alter table public.game_rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_events enable row level security;
