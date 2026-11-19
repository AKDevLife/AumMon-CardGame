# AumMon — Development Progress

> Updated: 2026-11-19 · Numbers from `pnpm progress` (top-level roadmap tasks; verified tasks only)

## Current

- **Phase:** 2 — Auth & Database Foundation (local database only)
- **Current task:** none in progress
- **Next task:** 2.8 Sign up / Login / Logout / session UI

## Completion

| Phase                   |   Done |  Total |       % |
| ----------------------- | -----: | -----: | ------: |
| 1 Project Foundation    |     14 |     16 |     88% |
| 2 Auth & Database       |      7 |     10 |     70% |
| 3 Pure Game Engine      |      0 |     13 |      0% |
| 4 Solo Vertical Slice   |      0 |     12 |      0% |
| 5 Pass & Play           |      0 |      5 |      0% |
| 6 Online Multiplayer    |      0 |      8 |      0% |
| 7 Public Launch & Scale |      0 |      8 |      0% |
| **Overall**             | **21** | **72** | **29%** |

## Completed

- 1.1–1.9 foundation, CI, operating rules, tracking
- 1.11 Vercel Preview per PR (verified)
- 1.13–1.16 UI Preview (layout, Home/Login/Register UI-only, `vercel.json`, iPhone E2E)
- 2.1 core schema migration (15 tables, constraints, indexes, schema separation, RLS deny-by-default)
- 2.7 browser Supabase client (publishable key only; rejects secret/service-role keys; null in UI preview mode)
- 2.6 access-matrix tests (A/B/non-member/anon/service_role, pass & play, lobby)
- 2.5 seed: 4 characters, 6 card definitions, standard deck v1 (40 cards)
- 2.4 RLS policies + `is_match_member` / `is_room_member`
- 2.3 least-privilege grants on `public`
- 2.2 profile auto-create + `updated_at` triggers

## In progress

None

## Blocked

| Task | Reason                                       | Owner action                                                        |
| ---- | -------------------------------------------- | ------------------------------------------------------------------- |
| 1.10 | No project ref / token / network to Supabase | Send project ref; approve network hosts; enter token in secret form |
| 1.12 | Repo settings                                | Enable branch protection on `main` requiring CI                     |
| 6.8  | Staging project may exceed free tier         | Approve cost / create project                                       |
| 7.8  | Production deploy                            | Approval at launch                                                  |

## Latest verification

- Local: `pnpm check` ✅ (30 tests, build, secret scan) · `pnpm test:e2e` ✅ 6 (incl. iPhone 13) · `pnpm db:test` ✅ (4 migrations + seed + 117 pgTAP tests)
- CI: see latest PR

## Rule questions

- All 12 in `docs/rule-clarifications.md` have provisional answers (revisit after playtest)
