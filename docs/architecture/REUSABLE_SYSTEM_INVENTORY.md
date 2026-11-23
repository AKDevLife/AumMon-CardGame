# AumMon — Reusable System Inventory

> Date: 2026-11-23 · Based on `FULL_TECHNICAL_AUDIT.md`. Classification is from code reading; automated tests were **not run** in this audit (last recorded green: 2026-11-22).

Legend: **R** Ready to Reuse · **RM** Reusable with Modification · **NR** Needs Refactoring · **RB** Must Be Rebuilt · **NI** Not Implemented · **UV** Unknown / Requires Verification

## Account & identity

| System                                    | Class | Why                                                                                                     |
| ----------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| Supabase Auth (register/login/logout)     | R     | Game-agnostic; `src/features/auth/*`                                                                    |
| Profiles (`public.profiles`, ProfilePage) | R     | No game fields; extend later via separate per-game stats table                                          |
| Account deletion + anonymization          | RM    | Trigger anonymizes `room_players` only; new per-game tables must add `on delete set null`/cascade rules |
| Server auth helper `requireUser`          | R     | `_shared/auth.ts`                                                                                       |
| Ban enforcement for existing tokens       | UV    | Depends on Supabase `getUser` behaviour for banned users (audit S1)                                     |

## Multiplayer

| System                                                            | Class | Why                                                                                                                |
| ----------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| Private rooms with join codes                                     | RM    | Solid security (hash, TTL, rate limit); hard-coded `ruleset_version '13'`, no `game_id`, seats 1–8                 |
| Ready / leave lobby                                               | RM    | Generic logic; needs `game_id` + per-game min/max players                                                          |
| Lobby UI (`OnlinePage`, `LobbyPage`)                              | RM    | Needs game selector and per-game seat limits                                                                       |
| Match lifecycle (lock, version, save, finish, rematch, leave→bot) | NR    | Correct pattern but fused with discard types in `_shared/game.ts`; split into platform orchestrator + game adapter |
| Idempotency receipts                                              | R     | Keyed by match + actor + key                                                                                       |
| Rate limiting                                                     | R     | Action-string based                                                                                                |
| Turn timers / deadlines                                           | RM    | Works per request; Poker needs reliable expiry (scheduled sweeper)                                                 |
| Realtime private match channel                                    | R     | Topic `match:{uuid}` + `is_match_member` — game-agnostic                                                           |
| Lobby realtime channel                                            | RM    | Move to private `room:{uuid}` topic                                                                                |
| Public matchmaking / Quick Match queue                            | NI    | No table, function or UI                                                                                           |
| Public room browser                                               | NI    | All online rooms are code-only                                                                                     |
| Reconnection                                                      | RM    | Resume = reload view by matchId + auto-play after 2 timeouts; no "active matches" lookup per user across games     |

## Bots

| System                                          | Class        | Why                                   |
| ----------------------------------------------- | ------------ | ------------------------------------- |
| Bot seat model (`player_type 'bot'`, leave→bot) | R            | Generic                               |
| Bot stepping (`advanceGame`, `BOT_STEP_MS`)     | NR           | Logic generic, but typed to `discard` |
| Bot decision (`discard/bot.ts`)                 | R (EDO only) | Game-specific by design               |
| Difficulty levels / bot config                  | NI           | Single strategy                       |
| Background bot runner                           | NI           | Request-driven only                   |

## Admin

| System                                         | Class | Why                                                       |
| ---------------------------------------------- | ----- | --------------------------------------------------------- |
| Admin RBAC + MFA aal2 + audit log              | R     | Strong base; add roles later                              |
| Player list / disable                          | R     |                                                           |
| Room close / close stale, match view / abandon | RM    | Need `game_id` filter; `match.view` assumes discard state |
| Bot simulation                                 | RM    | Discard-specific; move behind game admin hook             |
| Sound settings                                 | RM    | Global key; becomes per-game setting                      |
| Game activation / configuration                | NI    |                                                           |
| Per-game / read-only admin roles               | NI    | Only `super_admin`                                        |
| Logs (game, security)                          | R     |                                                           |
| Metrics views                                  | RM    | `metrics_matches_daily` lacks `game_id` grouping          |

## Backend & infrastructure

| System                                                       | Class | Why                                                       |
| ------------------------------------------------------------ | ----- | --------------------------------------------------------- |
| Postgres public/private split + RLS + least-privilege grants | R     | Pattern to copy for every game                            |
| `is_room_member` / `is_match_member`                         | R     | Game-agnostic                                             |
| Edge Function HTTP/CORS/input helpers                        | R     | `_shared/{http,input,origins}.ts`                         |
| Engine sync to Deno (`sync-engine.mjs`)                      | RM    | Must copy every game engine package                       |
| `ruleset_version` CHECK constraints                          | NR    | Must become per-game validation                           |
| `private.round_stats`                                        | RM    | EDO metrics; keep as EDO table, add generic match summary |
| Migrations (append-only)                                     | R     | Keep convention                                           |
| pgTAP suite                                                  | R     | Extend per table                                          |

## Frontend

| System                                                                                       | Class        | Why                                                            |
| -------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| Shared components (`StickerButton`, `TextField`, `Spinner`, `PreviewBanner`, `useClickBusy`) | R            |                                                                |
| Design tokens `am-*` (`docs/color_design_system.md`, `src/styles/index.css`)                 | R            |                                                                |
| Routing (`src/app/routes.tsx`)                                                               | RM           | Add `/games`, `/games/:gameId/...`; keep old URLs as redirects |
| HomePage                                                                                     | RM           | Becomes Game Center hub                                        |
| Game table UI (`src/features/game/*`)                                                        | R (EDO only) | Move under EDO module later                                    |
| Audio engine (`sound.ts`, `music.ts`)                                                        | RM           | Generic mechanism, EDO sound set                               |

## Deployment & tooling

| System                                                  | Class | Why                                                         |
| ------------------------------------------------------- | ----- | ----------------------------------------------------------- |
| CI (typecheck, lint, format, unit, pgTAP, E2E, secrets) | R     |                                                             |
| Engine isolation architecture test                      | RM    | Extend to every game engine package + cross-game import ban |
| Vercel config + security headers                        | R     |                                                             |
| Production project/backups                              | NI    | Owner-deferred (6.8, 7.3, 7.8)                              |

## Verified-findings summary

Counted over the 49 rows above: **Ready 21 (43%, incl. 2 EDO-only)**, **Reusable with modification 17 (35%)**, **Needs refactoring 3 (6%)**, **Must be rebuilt 0**, **Not implemented 7 (14%)**, **Unknown 1 (2%)**. About **78% of systems are reusable as-is or with modification; nothing must be rebuilt.** The 7 missing systems (matchmaking, room browser, difficulty, background bot runner, game activation, per-game admin roles, production) are new work, not rewrites.
