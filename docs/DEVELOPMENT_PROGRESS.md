# AumMon — Development Progress

> Updated: 2026-11-25 · Numbers from `pnpm progress` (top-level roadmap tasks; verified tasks only)

## Current

- **Status:** 🎉 Product Direction v2 (owner 2026-11-25): guest-first social party platform, flagship BLUFF. Phase 15.1–15.2 done; Dummy / Poker retired; EDO Battle deferred. Plan: `docs/v2/AumMon_Product_Direction_Audit.md`.
- **Phase:** 12 — engine, backend, UI, cleanup and VIP/gacha design (12.7) done.
- **Current task:** 15.4 approved (BLUFF ruleset "2"); 15.9 content design + 150 draft items done → owner review C1–C4 (`docs/v2/AumMon_Content_Management.md`). Next: 15.5 UI / 15.6 guest architecture (parallel).
- **Next:** 15.3 design → owner approval; art production paused (Q8).
- **Playtest URL (latest `main`):** https://aum-mon-card-game-git-playtest-aum-mon.vercel.app
- **Dev backend:** Supabase `AumMon-Dev` (ref `yaxtzdhryctfjaspxvix`, ap-northeast-1), email confirmation OFF for playtesting.

## Completion

| Phase                   |    Done |   Total |       % |
| ----------------------- | ------: | ------: | ------: |
| 1 Project Foundation    |      16 |      16 |    100% |
| 2 Auth & Database       |      10 |      10 |    100% |
| 3 Pure Game Engine      |      13 |      13 |    100% |
| 4 Solo Vertical Slice   |      12 |      12 |    100% |
| 5 Pass & Play (removed) |       5 |       5 |    100% |
| 6 Online Multiplayer    |       7 |       8 |     88% |
| 7 Public Launch & Scale |       6 |       8 |     75% |
| 9 Developer Admin       |      17 |      17 |    100% |
| 12 Discard Edition      |      20 |      21 |     95% |
| 13 AI Art Production    |       1 |       9 |     11% |
| 14 Game Center          |      13 |      14 |     93% |
| 15 Product v2           |       5 |      14 |     36% |
| **Overall**             | **125** | **147** | **85%** |

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
| GC7.3 | Decide whether to add scoped admin roles (who gets them)                 |
| 12.8  | Playtest Quick Match on Dev (best-of-3: no — owner 2026-11-23)           |
| 12.7  | Superseded by v2 economy design (15.8)                                   |
| 13.2  | Choose the Art Direction (`docs/art-production/AumMon_Art_Direction.md`) |

## Deferred (production — owner decision)

| Task | Needs                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------- |
| 6.8  | Separate Supabase project for production (`AumMon-Prod`; Pro plan advised)                          |
| 7.3  | Backup/restore test — needs 6.8 / Pro plan                                                          |
| 7.8  | Owner approval; final legal texts; email confirmation ON + SMTP; domain; Vercel protection decision |

## Latest verification (2026-11-23)

- PR #106: CI green (typecheck/lint/unit, pgTAP, backend + E2E on local Supabase); Dev smoke 8/8; Dev load test 20/20.

## Previous verification (2026-11-22)

- Local: `pnpm check` ✅ (typecheck, lint, format, unit/integration tests, build, secrets)
- Docs-only PR #105 (CI skips docs; local `pnpm check` is the gate)

## Rule questions

- Open questions and owner decisions: `docs/discard/AumMon_Rule_Clarification.md` — revisit after playtest (12.8).
