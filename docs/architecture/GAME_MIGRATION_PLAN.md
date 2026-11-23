# AumMon — Game Migration & Integration Plan

> Status: **APPROVED by the owner 2026-11-23** (G1–G3 accepted as proposed; GC0–GC8 authorised).

## Owner decisions (2026-11-23)

| ID  | Decision                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | EDO Battle = the current Casual Discard Edition (ruleset "13").                                                                                                       |
| G2  | Public name "EDO Battle" in Thai and English UI; platform brand "AumMon — Game Center".                                                                               |
| G3  | "Quick Match" in the UI now means platform matchmaking only; the EDO ruleset's old "Quick Match" label is not shown to players (internal docs keep the history name). |

Implementation note: game modules live as folders inside `packages/game-engine/src` (`sdk/`, `edo-battle/`, `dummy/`, `poker/`) instead of separate packages, so the Deno engine sync, purity lint and architecture tests keep working unchanged; isolation between folders is enforced by `tests/architecture/game-modules.test.ts`.

## 1. EDO Battle = Casual Discard Edition (confirmation needed)

The only playable game is the Casual Discard Edition, ruleset `"13"` (see `FULL_TECHNICAL_AUDIT.md` §0). The original 1v1 TCG was deleted (task 12.4, migration `20261122000100_discard_cutover.sql`) and cannot be restored without rebuilding it. **Owner question G1:** confirm "EDO Battle" means the current Discard Edition. If it means the retired TCG, this plan must change and the TCG would be a rebuild (git history only).

## 2. Preserving EDO Battle

Guarantees for every phase:

1. `packages/game-engine/src/discard/*` is not edited (only wrapped). Engine tests in `packages/game-engine/tests/` must stay green and unchanged.
2. `ruleset_version` stays `"13"`; no result-affecting change.
3. Existing URLs (`/play/solo`, `/play/online`, `/lobby/:roomId`, `/game/:matchId`, `/tutorial`) keep working (redirects if routes move).
4. Existing E2E (`tests/e2e/{solo,online,tutorial,a11y}.spec.ts`) and backend tests run unchanged as a regression gate on every Game Center PR.
5. A golden replay test (new): fixed seed + command script → byte-identical event log and final state before vs after each refactor.

## 3. Public name change → "EDO Battle"

- Scope: **UI copy only** — HomePage, page titles, tutorial headings, admin labels, `index.html` `<title>`, legal pages' product name, docs headers.
- Keep internal identifiers (`discard`, `@aummon/game-engine`, `ruleset_version`, table names). Internal `game_id` for new code: `edo_battle`.
- Platform brand stays "AumMon — Game Center".
- Thai name to be confirmed by owner (G2), e.g. "EDO Battle" in both languages.
- Rename the in-game "Quick Match" rules label in UI text to avoid clashing with platform matchmaking "Quick Match" (G3 — owner picks label).

## 4. Isolating EDO Battle from platform code

| Step | Change                                                                                                                                                                                                                                | Risk                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| E1   | Add `packages/game-sdk` interfaces; EDO adapter wraps `discard`                                                                                                                                                                       | None to gameplay                                  |
| E2   | Extract platform orchestrator from `_shared/game.ts` (lock/save/receipts/advance) into `_shared/platform/match.ts`; EDO-specific parts (hand_count update, round_stats, peek redaction) move to `_shared/games/edo_battle/adapter.ts` | Medium — covered by backend tests + golden replay |
| E3   | Replace hard-coded `'13'` with `registry.get(gameId).rulesetVersion`                                                                                                                                                                  | Low                                               |
| E4   | Client: `src/features/game/*` + tutorial registered as the EDO UI module; GamePage chooses table component by `game_id` from view response                                                                                            | Medium (UI) — E2E gate                            |
| E5   | Admin: `bots.simulate` + round stats exposed as EDO game-admin section                                                                                                                                                                | Low                                               |

## 5. Dummy integration plan

Rules are **not defined** in the repo. Thai Dummy (ดัมมี่) has many house variants (head card / "หัว", spe-to (สเปโต), knock, dummy-specific scoring, 2–4 players, 52 cards). Per project rules nothing is invented: Phase 3 starts with a rules document `docs/games/dummy/DUMMY_RULES.md` drafted from standard references and **approved by the owner** before engine code.

| Step | Deliverable                                                                                                                                      | Tests                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| D1   | Rules doc + owner approval (variants, scoring, players, round/game end)                                                                          | —                                                                                           |
| D2   | `packages/games/dummy` engine: deck, deal, draw (stock/discard-pile pickup with meld obligation), melds (sets/runs), lay-off, knock/out, scoring | Unit tests per rule, property tests (card conservation, no duplicates), determinism by seed |
| D3   | `view` + `publicEvent` redaction                                                                                                                 | Hidden-info contract test                                                                   |
| D4   | Bot easy/normal (greedy meld, discard highest deadwood)                                                                                          | Bot-vs-bot simulation completes 10k games without illegal moves                             |
| D5   | Server adapter + room/solo create with `gameId='dummy'`                                                                                          | Backend tests (local Supabase)                                                              |
| D6   | UI table (hand sorting, meld area, discard pile), mobile-first, Thai                                                                             | Vitest components + Playwright solo/online + axe                                            |

## 6. Poker integration plan (Texas Hold'em, play-money)

| Step | Deliverable                                                                                                                                                                                           | Tests                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| P1   | Rules doc: No-Limit Hold'em, blinds structure, buy-in, min-raise, all-in/side pots, showdown, odd-chip rule, timeouts (check/fold), table sizes 2–8, rebuy policy, daily free chips (owner decisions) | —                                                                                      |
| P2   | Hand evaluator (7-card, pure)                                                                                                                                                                         | Exhaustive category tests + known-hand fixtures, comparison against reference tables   |
| P3   | Betting engine + pot manager (side pots, split pots)                                                                                                                                                  | Property tests: chip conservation, pot = sum of contributions; scripted scenario tests |
| P4   | `view` (own hole cards only; showdown reveal) + redaction                                                                                                                                             | Hidden-info contract test                                                              |
| P5   | Bots using seat view: easy (hand-strength thresholds), normal (pot odds)                                                                                                                              | Simulation: no illegal actions, chips conserved                                        |
| P6   | Play-money ledger + server adapter (buy-in debits wallet, cash-out at leave credits wallet — internal chips only)                                                                                     | Ledger integrity pgTAP + backend tests                                                 |
| P7   | Timer reliability (`match-tick` sweeper) — required before online poker                                                                                                                               | Integration test with no client polling                                                |
| P8   | UI table                                                                                                                                                                                              | Vitest + Playwright + axe                                                              |

Compliance: play-money only, chips have no monetary value, no purchase/transfer/cash-out; terms page updated; age/legal check before any public launch (owner).

## 7. Bot & multiplayer integration (all games)

- Solo: `game-create {gameId, bots, difficulty, config}`.
- Private room: `rooms-create {gameId, maxPlayers, config}` (join code flow unchanged).
- Quick Match: `matchmaking-join {gameId, configKey}` → room auto-created → normal match flow.
- Online: leaving players replaced by bots (platform policy per game manifest; Poker: sit-out then fold, chips returned to wallet).

## 8. Required tests (gate per game)

1. Engine unit + property + determinism tests.
2. Hidden-information contract test (views and public events).
3. Bot simulation (no illegal moves, termination).
4. Adapter backend tests (local Supabase) incl. idempotency, wrong seat, wrong turn, stale version, timeouts.
5. pgTAP for new tables/RLS.
6. Playwright: solo, private room (2 browsers), quick match, reconnection; axe a11y.
7. EDO regression suite + golden replay on every PR.
8. Architecture tests: engine purity per package; no cross-game imports.
