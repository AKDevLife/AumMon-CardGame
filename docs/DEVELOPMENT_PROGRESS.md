# AumMon — Development Progress

> Updated: 2026-11-22 · Numbers from `pnpm progress` (top-level roadmap tasks; verified tasks only)

## Current

- **Status:** 🎮 Casual Discard Edition (ruleset "7", 2–8 players) is the only game; the 1v1 TCG was removed (code, tables, docs).
- **Phase:** 12 — engine, backend, UI and cleanup done.
- **Current task:** 12.8 owner playtest of Quick Match (ruleset "8") on Dev
- **Next:** 12.8 playtest + balance → 12.7 VIP/gacha design doc (build later). Art: 13.2 owner chooses Art Direction (`docs/art-production/`).
- **Playtest URL (latest `main`):** https://aum-mon-card-game-git-playtest-aum-mon.vercel.app
- **Dev backend:** Supabase `AumMon-Dev` (ref `yaxtzdhryctfjaspxvix`, ap-northeast-1), email confirmation OFF for playtesting.

## Completion

| Phase                   |   Done |   Total |       % |
| ----------------------- | -----: | ------: | ------: |
| 1 Project Foundation    |     16 |      16 |    100% |
| 2 Auth & Database       |     10 |      10 |    100% |
| 3 Pure Game Engine      |     13 |      13 |    100% |
| 4 Solo Vertical Slice   |     12 |      12 |    100% |
| 5 Pass & Play (removed) |      5 |       5 |    100% |
| 6 Online Multiplayer    |      7 |       8 |     88% |
| 7 Public Launch & Scale |      6 |       8 |     75% |
| 9 Developer Admin       |     17 |      17 |    100% |
| 12 Discard Edition      |     11 |      14 |     79% |
| 13 AI Art Production    |      1 |       9 |     11% |
| **Overall**             | **98** | **112** | **88%** |

## Completed (summary)

- **Phase 1:** monorepo, TS strict, lint/format, tests, CI, secret guard, operating rules, tracking; Supabase Dev + Vercel Preview + stable `playtest` URL; UI preview; branch rule (not enforced on Free plan — accepted).
- **Phase 2:** migrations, RLS, least-privilege grants, triggers, auth + profile UI.
- **Phase 3:** pure deterministic engine package + seeded RNG + isolation guards.
- **Phase 4:** solo backend (Edge Functions, row-locked transactions, idempotency, timeouts) + UI.
- **Phase 5:** Pass & Play — built, then removed by the owner (12.10, DC8).
- **Phase 6:** online lobby, join codes, rate limits, Realtime + Presence, resume, forfeit.
- **Phase 9:** admin RBAC (private roles, append-only audit, MFA aal2 server-side), `admin-api`, `/admin` dashboard.
- **Phase 12:** Discard Edition rules (DC1–DC7), engine + simulation, `game-*` functions, 2–8 player table UI, cutover migration; 1v1 TCG removed.
- **Phase 7:** security review + CSP/headers, no-cost monitoring, account deletion + draft legal pages, WCAG 2.1 AA, load test (20 players) + region fix, smoke test + runbook.

## In progress

None

## Waiting for the owner

| Task  | Needs                                                                    |
| ----- | ------------------------------------------------------------------------ |
| 12.8  | Playtest Quick Match on Dev; choose best-of-3 for 2–3 players (yes / no) |
| 12.14 | Decide Q1–Q4 (`docs/discard/AumMon_Game_Design_Upgrade.md` §3)           |
| 13.2  | Choose the Art Direction (`docs/art-production/AumMon_Art_Direction.md`) |

## Deferred (production — owner decision)

| Task | Needs                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------- |
| 6.8  | Separate Supabase project for production (`AumMon-Prod`; Pro plan advised)                          |
| 7.3  | Backup/restore test — needs 6.8 / Pro plan                                                          |
| 7.8  | Owner approval; final legal texts; email confirmation ON + SMTP; domain; Vercel protection decision |

## Latest verification (2026-11-22)

- Local: `pnpm check` ✅ (typecheck, lint, format, unit/integration tests, build, secrets)
- CI on PR #90: see PR

## Rule questions

- Open questions and owner decisions: `docs/discard/AumMon_Rule_Clarification.md` — revisit after playtest (12.8).
