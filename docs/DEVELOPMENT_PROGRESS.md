# AumMon — Development Progress

> Updated: 2026-11-20 · Numbers from `pnpm progress` (top-level roadmap tasks; verified tasks only)

## Current

- **Status:** ✅ Phase 8 complete — 1v1 TCG (ruleset 2) playable in all 3 modes on **Dev**; production work still deferred.
- **Phase:** 8 — complete; remaining tasks are production-only (6.8, 7.3, 7.8).
- **Current task:** none in progress
- **Next:** owner playtest of the 1v1 game → balance/UI adjustments; production (6.8 → 7.3 → 7.8) later.
- **Playtest URL (latest `main`):** https://aum-mon-card-game-git-playtest-aum-mon.vercel.app
- **Dev backend:** Supabase `AumMon-Dev` (ref `yaxtzdhryctfjaspxvix`, ap-northeast-1), email confirmation OFF for playtesting.

## Completion

| Phase                   |   Done |  Total |       % |
| ----------------------- | -----: | -----: | ------: |
| 1 Project Foundation    |     16 |     16 |    100% |
| 2 Auth & Database       |     10 |     10 |    100% |
| 3 Pure Game Engine      |     13 |     13 |    100% |
| 4 Solo Vertical Slice   |     12 |     12 |    100% |
| 5 Pass & Play           |      5 |      5 |    100% |
| 6 Online Multiplayer    |      7 |      8 |     88% |
| 7 Public Launch & Scale |      6 |      8 |     75% |
| 8 1v1 TCG Ruleset       |     14 |     14 |    100% |
| **Overall**             | **83** | **86** | **97%** |

## Completed (summary)

- **Phase 1:** monorepo, TS strict, lint/format, tests, CI, secret guard, operating rules, tracking; Supabase Dev + Vercel Preview + stable `playtest` URL; UI preview; branch rule (not enforced on Free plan — accepted).
- **Phase 2:** 9 migrations, RLS, least-privilege grants, triggers, seed (4 characters, 40-card deck), auth + profile UI.
- **Phase 3:** pure engine implementing Rulebook v1 + provisional clarifications Q1–Q12, normal bot, simulations.
- **Phase 4:** solo backend (Edge Functions, row-locked transactions, idempotency, timeouts) + UI.
- **Phase 5:** Pass & Play with server-chosen seat and privacy handoff.
- **Phase 6:** online lobby, join codes, rate limits, Realtime + Presence, resume, forfeit.
- **Phase 8:** 8.1 single spec v3.0 (1v1 TCG) + docs aligned; 8.2 card data + validation; 8.3 engine core; 8.4 combat + keywords; 8.5 actions + equipment; 8.6 evolution + fusion; 8.7 simulation; 8.8 bot; 8.9 DB catalog; 8.10 backend `tcg-*` functions; 8.11 board UI + Solo; 8.12 Pass & Play; 8.13 Online; 8.14 ruleset 1 retired (`packages/game-engine/src/rules/v2`).
- **Phase 7:** security review + CSP/headers, no-cost monitoring, account deletion + draft legal pages, WCAG 2.1 AA, load test (20 players) + region fix, smoke test + runbook.

## In progress

None

## Deferred (production — owner decision)

| Task | Needs                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------- |
| 6.8  | Separate Supabase project for production (`AumMon-Prod`; Pro plan advised)                          |
| 7.3  | Backup/restore test — needs 6.8 / Pro plan                                                          |
| 7.8  | Owner approval; final legal texts; email confirmation ON + SMTP; domain; Vercel protection decision |

## Latest verification (2026-11-20)

- Local: `pnpm check` ✅ 163 unit/integration tests · pgTAP ✅ (10 suites)
- CI on PR #55: ✅ all jobs (backend + E2E on local Supabase)
- Cloud (AumMon-Dev + playtest): smoke ✅ 8/8 · E2E ✅ solo, pass & play, online (two browsers) · load test ✅ 20/20 matches, `tcg-command` server p50 138 ms / p95 360 ms

## Rule questions

- Ruleset 2 decisions R2-2…R2-8 in `docs/rule-clarifications.md` (owner, provisional) — revisit after playtesting.
