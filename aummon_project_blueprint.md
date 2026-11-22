# AumMon — Project Blueprint (Casual Discard Edition)

> Architecture, database, security and test plan. Game rules: `aummon_game_spec.md` → `docs/discard/`. Roadmap and status: `docs/DEVELOPMENT_ROADMAP.md`, `docs/DEVELOPMENT_PROGRESS.md`.
> Rewritten 2026-11-22 (task 12.4) when the 1v1 TCG was removed; history lives in git and `docs/DEVELOPMENT_CHANGELOG.md`.

## 1. Stack

pnpm workspaces · React 19 + Vite + TypeScript strict · Tailwind v4 (`am-*` tokens, `docs/color_design_system.md`) · Supabase (Auth, PostgreSQL, Edge Functions on Deno, Realtime) · Vercel · Vitest · Playwright · pgTAP.

## 2. Architecture

```text
Browser (React)  ──intent──▶  Edge Functions (Deno)  ──▶  PostgreSQL (public + private schemas)
     ▲                              │ uses
     └──── per-seat view ◀──────────┘ packages/game-engine (pure TS, synced copy)
```

- **Engine** (`packages/game-engine/src/discard`): `startGame(players, rng)`, `applyCommand(state, seat, command)`, `getView(state, seat)`, `chooseBotCommand`. Deterministic: seeded RNG stored server-side; no I/O, clock or `Math.random`.
- **Server-authoritative:** clients send `play {card, useAbility, choice}`, `draw` or `react {useUmbrella}` plus an idempotency key. The server validates seat, turn and phase, runs the engine, stores the state and events.
- **Flow** (`supabase/functions/_shared/game-flow.ts`): after each command the server runs bots one step at a time (`BOT_STEP_MS` 700) and applies timeouts — turn 45 s → auto-draw, reaction 8 s → decline.
- **Privacy:** `game-view` returns only the caller's hand, counts for others, and peek cards only to the peeking seat. Stored and broadcast events never contain private cards.
- **Modes:** Solo (1 human + 1–7 bots), Pass & Play (2–8 local seats; privacy by hand-off screen on one device), Online (room code, 2–8 seats, ready → `game-start`; leaving online seats become bots).

## 3. Edge Functions

| Function | Purpose |
| --- | --- |
| `game-create` | Solo / Pass & Play match |
| `game-start` | Start an online room's match (owner, all ready) |
| `game-view` | Per-seat view (+ advance due bots/timeouts) |
| `game-command` | Play / draw / react intent |
| `game-leave` | Leave or forfeit |
| `rooms-create` / `rooms-join` / `rooms-ready` / `rooms-leave` | Online lobby |
| `account-delete` | Delete own account (history anonymized) |
| `admin-api` | Developer admin (MFA, roles, audit log) |
| `engine-health` | Engine and ruleset version check |

## 4. Database

| Schema | Tables |
| --- | --- |
| `public` (RLS on every table) | `profiles`, `game_rooms` (max_players 2–8), `room_players` (seats 1–8), `matches` (phase `play`/`reaction`/`finished`, ruleset `7`), `match_players` (seat, player_type, `hand_count`, status `playing`/`won`/`left`), `match_events`, `game_settings` |
| `private` (never exposed by the API) | `match_runtime` (engine state, RNG, deadlines, resolve lease), `command_receipts` (idempotency), `rate_limits`, `function_metrics`, `admin_roles`, `admin_audit_log` |

- Migrations are append-only (`supabase/migrations/`); `20261122000100_discard_cutover.sql` removed the TCG tables and data.
- Members read their own room and match rows only; all writes go through Edge Functions with the service role.
- Account deletion: profile removed, rooms and matches kept with the user link nulled and seats anonymized.

## 5. Security

- No secrets in the client or git (`pnpm check:secrets`); only public `VITE_*` values.
- Every command is authenticated, authorized for its seat, rate limited and idempotent.
- Hands, deck order, RNG and peeks stay in `private` or in the requesting seat's view.
- Admin: MFA (aal2), role table, audit log; Dev and production are separate projects.

## 6. Test plan

| Layer | Where | Covers |
| --- | --- | --- |
| Engine | `packages/game-engine/tests` | every card ability, pile reset, reactions, direction, winning, bots, 2–8 player simulation |
| Architecture | `tests/architecture` | engine isolation |
| Integration / backend | `tests/integration`, `tests/backend` | game flow, timeouts, bots, privacy of views, online rooms, admin, account deletion |
| Database | `supabase/tests/database` (pgTAP) | schema, constraints, RLS, access matrix, account deletion |
| UI / E2E | `tests/e2e` (Playwright) | Solo, Pass & Play, Online flows; accessibility |

Gate: `pnpm check` locally + CI on the pull request (CI also runs pgTAP and E2E).
