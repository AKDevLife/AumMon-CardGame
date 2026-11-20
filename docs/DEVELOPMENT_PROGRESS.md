# AumMon — Development Progress

> Updated: 2026-11-20 · Numbers from `pnpm progress` (top-level roadmap tasks; verified tasks only)

## Current

- **Phase:** 7 — Public Launch & Scale Evaluation (Dev cloud project live)
- **Current task:** none in progress
- **Next task:** 7.1 Security review + abuse checks

## Completion

| Phase                   |   Done |  Total |       % |
| ----------------------- | -----: | -----: | ------: |
| 1 Project Foundation    |     15 |     16 |     94% |
| 2 Auth & Database       |     10 |     10 |    100% |
| 3 Pure Game Engine      |     13 |     13 |    100% |
| 4 Solo Vertical Slice   |     12 |     12 |    100% |
| 5 Pass & Play           |      5 |      5 |    100% |
| 6 Online Multiplayer    |      7 |      8 |     88% |
| 7 Public Launch & Scale |      0 |      8 |      0% |
| **Overall**             | **62** | **72** | **86%** |

## Completed

- 1.1–1.9 foundation, CI, operating rules, tracking
- 1.10 Supabase Dev project linked (migrations, seed, functions, CORS, auth redirects)
- 1.11 Vercel Preview per PR (verified)
- 1.13–1.16 UI Preview (layout, Home/Login/Register UI-only, `vercel.json`, iPhone E2E)
- 2.1 core schema migration (15 tables, constraints, indexes, schema separation, RLS deny-by-default)
- 6.1–6.7 Online: lobby with hashed/expiring 8-char join code, rate limits, ready/start/leave, Realtime (RLS postgres_changes + private match channel with Presence), resume, forfeit, lazy 30s timeout, two-browser E2E
- 5.1–5.5 Pass & Play: local seats, server-chosen current seat, privacy handoff (hand only after reveal), shared-device notice, E2E
- 4.10 security attack tests (1–8, 10)
- 4.9 / 4.11 / 4.12 solo UI (character & bot select, board, hand, target/choice, Aqua skill, event log, result) + E2E plays a full match
- 4.2–4.8 solo backend: `rooms-create`, `matches-start`, `matches-view`, `matches-submit-action`, `matches-use-skill`; row-locked transactions, idempotency receipts, lazy 30s/15s timeouts, server bots
- 4.1 engine runs in Edge Functions (Deno) via generated `_shared/game-engine` copy; CI boots `engine-health`
- 3.1–3.13 pure engine: domain, seeded RNG, deck/hand, registry, validator, all card effects, character skills, resolver, player view, normal bot, timeout auto-submit, simulations
- 2.10 auth E2E against local Supabase (CI job `e2e-auth`)
- 2.9 profile page (own display name, RLS-scoped)
- 2.8 sign up / login / logout / session (verified against local Supabase Auth)
- 2.7 browser Supabase client (publishable key only; rejects secret/service-role keys; null in UI preview mode)
- 2.6 access-matrix tests (A/B/non-member/anon/service_role, pass & play, lobby)
- 2.5 seed: 4 characters, 6 card definitions, standard deck v1 (40 cards)
- 2.4 RLS policies + `is_match_member` / `is_room_member`
- 2.3 least-privilege grants on `public`
- 2.2 profile auto-create + `updated_at` triggers

## In progress

None

## Blocked

| Task | Reason                               | Owner action                                    |
| ---- | ------------------------------------ | ----------------------------------------------- |
| 1.12 | Repo settings                        | Enable branch protection on `main` requiring CI |
| 6.8  | Staging project may exceed free tier | Approve cost / create project                   |
| 7.8  | Production deploy                    | Approval at launch                              |

## Latest verification

- Local: `pnpm check` ✅ (128 tests incl. engine, build, secret scan) · backend integration ✅ 20 (local Supabase + Edge Functions) · `pnpm test:e2e` ✅ 10 (incl. full solo, pass & play and two-browser online matches) (incl. iPhone 13 + auth flow on local Supabase) · `pnpm db:test` ✅ (7 migrations + seed + 121 pgTAP tests)
- CI: see latest PR

## Rule questions

- All 12 in `docs/rule-clarifications.md` have provisional answers (revisit after playtest)
