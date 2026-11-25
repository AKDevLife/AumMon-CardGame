# AumMon — Test Strategy v2 (15.10)

> Extends blueprint §6. Every slice in `AumMon_Technical_Migration_Plan.md` §3 ships with its tests; CI (`.github/workflows/ci.yml`) must be green before merge.

| Layer            | Tool                         | v2 additions                                                                                                                                                                                                                     |
| ---------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engine unit      | Vitest                       | SDK contract suite for every module (single + simultaneous seats); BLUFF scoring table per variant, tie-break, timeouts, hidden view; property test: total points = sum of rule outcomes                                         |
| Engine sim       | `scripts/bluff-sim.mjs`      | kept as balance reference; re-run on any ruleset change and record numbers in the changelog                                                                                                                                      |
| Database         | pgTAP                        | guest vs account RLS, restrictive account-only policy, anon role blocked, content tables not readable by clients, seat 1–8 checks, `cleanup_guests`                                                                              |
| Backend          | Vitest + local Supabase      | guest → room → join by code → full BLUFF match (3 players, concurrent locks); 409 for non-pending seat; timeout defaults; 403 `account_required`; linking keeps user id; content selection respects humor / group / player count |
| E2E              | Playwright (phone 360 px)    | first visit → nickname → create room; second browser context joins by code; play 1 round; results + share; reload keeps identity; no horizontal scroll                                                                           |
| Accessibility    | axe in Playwright            | Home, Lobby, Lock, Reveal, Results on the dark theme (contrast ≥ 4.5 : 1)                                                                                                                                                        |
| Security         | `pnpm check:secrets`, review | no hidden choice in broadcasts / views before Reveal (test asserts on serialized payloads)                                                                                                                                       |
| Playtest (15.12) | telemetry                    | lock time p90 per size, claim usage, silent-player win rate, items with a dominant option                                                                                                                                        |

- Existing EDO tests stay green; the known flaky EDO solo backend test is fixed in S1 (root cause: a bot may move first and make seat 0 draw before the first view).
- Deterministic tests: seeded RNG only; no wall-clock in the engine (existing rules).
