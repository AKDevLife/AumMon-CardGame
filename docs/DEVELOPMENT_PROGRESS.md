# AumMon — Development Progress

> Updated: 2026-11-27 · Numbers from `pnpm progress` (all roadmaps, top-level tasks, verified only).

## Current

- **Platform:** AumMon party game platform, one dark theme + shell (16.1); docs merged (16.2).
- **Games:** AumMon BLUFF (flagship, ruleset "2", bots fill seats) · AumMon Object Battle Card (`edo_battle`, ruleset "13").
- **Current task:** BLUFF 15.12 closed playtest (owner, real phones 2 / 4 / 8).
- **Playtest URL (`main`):** https://aum-mon-card-game-git-playtest-aum-mon.vercel.app
- **Dev backend:** Supabase `AumMon-Dev` (ref `yaxtzdhryctfjaspxvix`). `AumMon-Production` exists but is untouched (owner approval required).

## Docs map

| Scope         | Spec                               | Roadmap                               |
| ------------- | ---------------------------------- | ------------------------------------- |
| Platform      | `docs/platform/PLATFORM_SPEC.md`   | `docs/platform/ROADMAP.md`            |
| BLUFF         | `docs/games/bluff/SPEC.md`         | `docs/games/bluff/ROADMAP.md`         |
| Object Battle | `docs/games/object-battle/SPEC.md` | `docs/games/object-battle/ROADMAP.md` |

## Completion

| Roadmap       |    Done |   Total |       % |
| ------------- | ------: | ------: | ------: |
| Platform      |      79 |      84 |     94% |
| BLUFF         |       3 |       5 |     60% |
| Object Battle |      50 |      51 |     98% |
| **Overall**   | **132** | **140** | **94%** |

## Waiting for the owner

| Task  | Needs                                             |
| ----- | ------------------------------------------------- |
| 15.12 | Playtest sessions 2 / 4 / 8 players, send results |
| GC7.3 | Decide on scoped admin roles                      |
| 12.8  | Playtest Object Battle Quick Match                |

## Deferred (production — owner decision)

| Task | Needs                                                                                   |
| ---- | --------------------------------------------------------------------------------------- |
| 6.8  | Production Supabase project setup (Pro plan advised)                                    |
| 7.3  | Backup / restore test (needs 6.8)                                                       |
| 7.8  | Owner approval; final legal texts; email confirmation + SMTP; domain; Vercel protection |

## Latest verification (2026-11-27)

- PRs #134–#138: CI green (unit, pgTAP, backend + E2E on local Supabase, axe); Dev deploy + bot smoke (1 guest + 3 bots, full match) OK.
