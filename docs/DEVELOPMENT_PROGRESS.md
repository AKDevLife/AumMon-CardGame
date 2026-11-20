# AumMon — Development Progress

> Updated: 2026-11-20 · Numbers from `pnpm progress` (top-level roadmap tasks; verified tasks only)

## Current

- **Status:** ▶ Phase 8 — game rules replaced by 1v1 TCG (Spec v3.0); platform kept.
- **Phase:** 8 — 1v1 TCG Ruleset (`ruleset_version = "2"`)
- **Current task:** none in progress
- **Next:** 8.11 UI 1v1 board + Solo; production (6.8 → 7.3 → 7.8) still deferred.
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
| 8 1v1 TCG Ruleset       |     10 |     14 |     71% |
| **Overall**             | **79** | **86** | **92%** |

## Completed (summary)

- **Phase 1:** monorepo, TS strict, lint/format, tests, CI, secret guard, operating rules, tracking; Supabase Dev + Vercel Preview + stable `playtest` URL; UI preview; branch rule (not enforced on Free plan — accepted).
- **Phase 2:** 9 migrations, RLS, least-privilege grants, triggers, seed (4 characters, 40-card deck), auth + profile UI.
- **Phase 3:** pure engine implementing Rulebook v1 + provisional clarifications Q1–Q12, normal bot, simulations.
- **Phase 4:** solo backend (Edge Functions, row-locked transactions, idempotency, timeouts) + UI.
- **Phase 5:** Pass & Play with server-chosen seat and privacy handoff.
- **Phase 6:** online lobby, join codes, rate limits, Realtime + Presence, resume, forfeit.
- **Phase 8:** 8.1 single spec v3.0 (1v1 TCG) + docs aligned; 8.2 card data + validation; 8.3 engine core; 8.4 combat + keywords; 8.5 actions + equipment; 8.6 evolution + fusion; 8.7 simulation; 8.8 bot; 8.9 DB catalog; 8.10 backend `tcg-*` functions (`packages/game-engine/src/rules/v2`).
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

- Local: `pnpm check` ✅ 241 unit/integration tests · pgTAP ✅ (10 suites) · backend ✅ 21 · E2E ✅ 16 (incl. axe a11y, solo, pass & play, two-browser online)
- Cloud (AumMon-Dev + playtest): smoke ✅ 8/8 · load test ✅ 20/20 matches, submit p50 261 ms
- CI on `main`: ✅

## Rule questions

- All 12 in `docs/rule-clarifications.md` have provisional answers — revisit after playtesting.
