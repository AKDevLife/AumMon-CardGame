-- AumMon tasks 4.3/4.4/4.12 — match flow support.
-- * phase 'turn_start' for the Aqua skill window (Rule 11; clarification Q7).
-- * Select / skill deadline for the 30s timeout (Rule 14), evaluated by the server.
-- Concurrency: every command runs in one transaction holding a row lock on
-- public.matches (SELECT ... FOR UPDATE), so only one resolver per match/round.
-- The canonical engine state lives in private.match_runtime.internal_state.

alter table public.matches drop constraint matches_phase_check;
alter table public.matches add constraint matches_phase_check
  check (phase in ('setup','draw','turn_start','select','resolving','end'));

alter table private.match_runtime add column phase_deadline timestamptz;

create index match_events_round_idx on public.match_events(match_id, round_number);
