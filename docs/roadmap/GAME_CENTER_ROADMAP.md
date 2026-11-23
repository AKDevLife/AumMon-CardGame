# AumMon — Game Center Roadmap

> Status: **APPROVED 2026-11-23** (owner authorised GC0–GC8; GC9 stays owner-gated). Phase totals are mirrored in `docs/DEVELOPMENT_ROADMAP.md` Phase 14 for `pnpm progress`.
> Status markers: `[ ]` not started · `[~]` in progress · `[x]` done (verified) · `[!]` blocked. Complexity S/M/L. Priority P0 (must) / P1 / P2.
> Every implementation task: `pnpm check` + CI green + EDO regression (unit, backend, E2E, golden replay) green.

## Phase 0 — Audit & Architecture

| ID    | Task                                               | Pri | Deps  | Cx  | Acceptance                                                                  | Tests | Status                                 |
| ----- | -------------------------------------------------- | --- | ----- | --- | --------------------------------------------------------------------------- | ----- | -------------------------------------- |
| GC0.1 | Technical audit + 7 architecture docs              | P0  | —     | M   | Docs exist, evidence-based                                                  | —     | [x] (2026-11-23; owner review pending) |
| GC0.2 | Owner decisions G1–G3 + Dummy/Poker rule questions | P0  | GC0.1 | S   | Answers recorded in `docs/discard/AumMon_Rule_Clarification.md` / game docs | —     | [x] G1–G3 approved 2026-11-23          |

## Phase 1 — Platform Foundation & Game Registry

| ID    | Task                                                                                                                           | Pri | Deps  | Cx  | Acceptance                                     | Tests                     | Status            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | --- | ----- | --- | ---------------------------------------------- | ------------------------- | ----------------- |
| GC1.1 | Golden replay + EDO regression baseline                                                                                        | P0  | GC0.2 | S   | Seeded command script produces stored snapshot | Vitest snapshot           | [~] PR pending CI |
| GC1.2 | `sdk/` Game Module Interface + generic flow in `packages/game-engine/src` + architecture tests (purity, no cross-game imports) | P0  | GC1.1 | M   | Package builds; tests fail on forbidden import | Architecture tests        | [~] PR pending CI |
| GC1.3 | Migration M1 `games` + M2 `game_id` on rooms/matches                                                                           | P0  | GC1.2 | S   | Existing rows = `edo_battle`; RLS on `games`   | pgTAP                     | [~] PR pending CI |
| GC1.4 | Server game registry; clients read `public.games` via RLS (no extra function)                                                  | P0  | GC1.3 | S   | Returns enabled games only                     | Backend test              | [~] PR pending CI |
| GC1.5 | Client registry + Game Center hub page (EDO only card)                                                                         | P0  | GC1.4 | M   | Home shows hub; old routes still work          | Vitest + Playwright + axe | [~] PR pending CI |
| GC1.6 | Architecture test: every function calls `requireUser` or is allow-listed                                                       | P1  | —     | S   | Test fails on a function without auth          | Architecture test         | [~] PR pending CI |

## Phase 2 — EDO Battle Preservation & Integration

| ID    | Task                                                                                      | Pri | Deps         | Cx  | Acceptance                               | Tests                | Status            |
| ----- | ----------------------------------------------------------------------------------------- | --- | ------------ | --- | ---------------------------------------- | -------------------- | ----------------- |
| GC2.1 | EDO adapter implementing `GameEngine` (wraps `discard`, no engine edits)                  | P0  | GC1.2        | M   | Adapter passes golden replay             | Unit + golden        | [~] PR pending CI |
| GC2.2 | Extract platform match orchestrator from `_shared/game.ts`; dispatch by `matches.game_id` | P0  | GC2.1, GC1.3 | L   | All backend + E2E tests green, unchanged | Backend, E2E, golden | [~] PR pending CI |
| GC2.3 | Remove hard-coded `'13'` (lobby/game) via registry; M3/M4 per-game CHECKs                 | P0  | GC2.2        | M   | Same behaviour                           | pgTAP + backend      | [~] PR pending CI |
| GC2.4 | Public rename to "EDO Battle" (UI copy only)                                              | P0  | GC0.2        | S   | No identifier changes; copy updated      | Vitest + E2E text    | [~] PR pending CI |
| GC2.5 | Generic GamePage shell selecting table by `game_id`                                       | P1  | GC2.2        | M   | EDO UI unchanged visually                | E2E + axe            | [ ]               |
| GC2.6 | M6 match results + M8 player stats (backfill EDO)                                         | P1  | GC2.2        | M   | Profile shows per-game played/won        | pgTAP + backend      | [ ]               |
| GC2.7 | Private `room:{id}` realtime topic (M14)                                                  | P2  | GC1.3        | S   | Lobby uses private channel               | pgTAP + E2E online   | [ ]               |
| GC2.8 | `match-tick` sweeper for overdue deadlines (verify cost = free)                           | P1  | GC2.2        | M   | Bot/timeouts advance with no client      | Integration          | [ ]               |

## Phase 3 — Dummy Game Engine

| ID    | Task                                                                         | Pri | Deps         | Cx  | Acceptance                    | Tests                         | Status |
| ----- | ---------------------------------------------------------------------------- | --- | ------------ | --- | ----------------------------- | ----------------------------- | ------ |
| GC3.1 | Dummy rules doc, owner-approved                                              | P0  | GC0.2        | M   | Approved with variant choices | —                             | [ ]    |
| GC3.2 | Engine: deck, deal, draw, discard pickup, melds, lay-off, round end, scoring | P0  | GC3.1, GC1.2 | L   | All rules covered             | Unit + property + determinism | [ ]    |
| GC3.3 | `view` + `publicEvent` redaction                                             | P0  | GC3.2        | S   | No hidden card leaks          | Contract test                 | [ ]    |

## Phase 4 — Dummy Bot & Multiplayer

| ID    | Task                                                                  | Pri | Deps         | Cx  | Acceptance                                  | Tests                     | Status |
| ----- | --------------------------------------------------------------------- | --- | ------------ | --- | ------------------------------------------- | ------------------------- | ------ |
| GC4.1 | Bots easy/normal (seat view only)                                     | P0  | GC3.3        | M   | 10k sims, no illegal moves                  | Simulation                | [ ]    |
| GC4.2 | Server adapter, solo + private rooms                                  | P0  | GC4.1, GC2.3 | M   | Playable end to end                         | Backend                   | [ ]    |
| GC4.3 | Dummy table UI (mobile-first, Thai)                                   | P0  | GC4.2        | L   | Playable solo + online                      | Vitest + Playwright + axe | [ ]    |
| GC4.4 | Matchmaking queue M7 + `matchmaking-*` (generic, first used by Dummy) | P1  | GC4.2        | M   | 2 users auto-paired; bot fill after timeout | Backend + E2E             | [ ]    |

## Phase 5 — Poker Game Engine

| ID    | Task                                                | Pri | Deps  | Cx  | Acceptance                          | Tests               | Status |
| ----- | --------------------------------------------------- | --- | ----- | --- | ----------------------------------- | ------------------- | ------ |
| GC5.1 | Poker rules + play-money policy doc, owner-approved | P0  | GC0.2 | M   | Blinds, buy-in, free chips decided  | —                   | [ ]    |
| GC5.2 | Hand evaluator                                      | P0  | GC5.1 | M   | All categories + tie-breaks correct | Exhaustive fixtures | [ ]    |
| GC5.3 | Betting + side pots + showdown engine               | P0  | GC5.2 | L   | Chip conservation                   | Property + scenario | [ ]    |
| GC5.4 | View/redaction                                      | P0  | GC5.3 | S   | Hole cards private                  | Contract test       | [ ]    |

## Phase 6 — Poker Bot & Multiplayer

| ID    | Task                                            | Pri | Deps                | Cx  | Acceptance                          | Tests                     | Status |
| ----- | ----------------------------------------------- | --- | ------------------- | --- | ----------------------------------- | ------------------------- | ------ |
| GC6.1 | Bots easy/normal                                | P0  | GC5.4               | M   | No illegal actions in sims          | Simulation                | [ ]    |
| GC6.2 | Chip wallet + ledger (M11) + hand history (M12) | P0  | GC2.3               | M   | Append-only, balance ≥ 0            | pgTAP                     | [ ]    |
| GC6.3 | Server adapter (requires GC2.8 sweeper)         | P0  | GC6.1, GC6.2, GC2.8 | L   | Timed betting works without polling | Backend + integration     | [ ]    |
| GC6.4 | Poker table UI                                  | P0  | GC6.3               | L   | Solo + private + quick match        | Vitest + Playwright + axe | [ ]    |

## Phase 7 — Centralized Admin & Game Management

| ID    | Task                                                                         | Pri | Deps  | Cx  | Acceptance                              | Tests               | Status |
| ----- | ---------------------------------------------------------------------------- | --- | ----- | --- | --------------------------------------- | ------------------- | ------ |
| GC7.1 | Admin: games on/off, per-game settings (M9)                                  | P0  | GC1.3 | M   | Disabled game hidden + creation refused | Backend + E2E admin | [ ]    |
| GC7.2 | Room/match monitoring filtered by game                                       | P1  | GC2.2 | S   | Filters work                            | Backend             | [ ]    |
| GC7.3 | Scoped roles `game_admin`/`viewer` (M10)                                     | P1  | GC7.1 | M   | Scoped access enforced server-side      | Backend + pgTAP     | [ ]    |
| GC7.4 | Game-specific admin sections via registry (EDO stats/sim, Poker chip grants) | P1  | GC7.1 | M   | Audit-logged                            | Backend             | [ ]    |

## Phase 8 — Full Integration Testing

| ID    | Task                                                      | Pri | Deps         | Cx  | Acceptance                | Tests          | Status |
| ----- | --------------------------------------------------------- | --- | ------------ | --- | ------------------------- | -------------- | ------ |
| GC8.1 | Cross-game E2E matrix (3 games × 4 modes where supported) | P0  | GC4.4, GC6.4 | M   | All green                 | Playwright     | [ ]    |
| GC8.2 | Load test per game (extend `tests/load/solo-load.mjs`)    | P1  | GC8.1        | M   | p95 within targets on Dev | Load           | [ ]    |
| GC8.3 | Security review update (hidden info, RLS, admin scopes)   | P0  | GC8.1        | M   | No high findings          | Review + pgTAP | [ ]    |

## Phase 9 — Production Readiness

| ID    | Task                                                             | Pri | Deps  | Cx  | Acceptance             | Tests | Status    |
| ----- | ---------------------------------------------------------------- | --- | ----- | --- | ---------------------- | ----- | --------- |
| GC9.1 | Existing blockers 6.8 / 7.3 / 7.8 (prod project, backups, legal) | P0  | owner | M   | Owner approved         | Smoke | [!] owner |
| GC9.2 | Legal review for play-money poker                                | P0  | GC6.4 | S   | Owner + legal sign-off | —     | [!] owner |
| GC9.3 | Runbook update (`docs/OPERATIONS.md`) for multi-game             | P1  | GC8.3 | S   | Documented             | —     | [ ]       |

## Milestones

1. **M-A Platform ready (end Phase 2):** hub + registry, EDO behind adapter, zero regression.
2. **M-B Dummy playable (end Phase 4).**
3. **M-C Poker playable (end Phase 6).**
4. **M-D Central admin (Phase 7).**
5. **M-E Release candidate (Phases 8–9).**
