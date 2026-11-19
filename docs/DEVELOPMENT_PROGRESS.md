# AumMon — Development Progress

> Updated: 2026-11-19 · Numbers from `pnpm progress` (top-level roadmap tasks; verified tasks only)

## Current

- **Phase:** 2 — Auth & Database Foundation (local database only)
- **Current task:** none in progress
- **Next task:** 2.2 profiles / `updated_at` triggers

## Completion

| Phase                   |   Done |  Total |       % |
| ----------------------- | -----: | -----: | ------: |
| 1 Project Foundation    |      9 |     12 |     75% |
| 2 Auth & Database       |      1 |     10 |     10% |
| 3 Pure Game Engine      |      0 |     13 |      0% |
| 4 Solo Vertical Slice   |      0 |     12 |      0% |
| 5 Pass & Play           |      0 |      5 |      0% |
| 6 Online Multiplayer    |      0 |      8 |      0% |
| 7 Public Launch & Scale |      0 |      8 |      0% |
| **Overall**             | **10** | **68** | **15%** |

## Completed

- 1.1–1.9 foundation, CI, operating rules, tracking
- 2.1 core schema migration (15 tables, constraints, indexes, schema separation, RLS deny-by-default)

## In progress

None

## Blocked

| Task | Reason                                       | Owner action                                                        |
| ---- | -------------------------------------------- | ------------------------------------------------------------------- |
| 1.10 | No project ref / token / network to Supabase | Send project ref; approve network hosts; enter token in secret form |
| 1.11 | Vercel env vars not verifiable from session  | Set `VITE_SUPABASE_*` for Preview; confirm or send Preview URL      |
| 1.12 | Repo settings                                | Enable branch protection on `main` requiring CI                     |
| 6.8  | Staging project may exceed free tier         | Approve cost / create project                                       |
| 7.8  | Production deploy                            | Approval at launch                                                  |

## Latest verification

- Local: `pnpm check` ✅ (12 tests, build, secret scan) · `pnpm db:test` ✅ (migration + 35 pgTAP tests)
- CI: see latest PR

## Rule questions

- All 12 in `docs/rule-clarifications.md` have provisional answers (revisit after playtest)
