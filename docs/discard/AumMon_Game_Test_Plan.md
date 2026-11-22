# AumMon — Game Test Plan (Quick Match)

> Task 12.11 · Applies when the Quick Match proposal (ruleset "8") is approved and implemented. Layers follow `aummon_project_blueprint.md` §6.

## 1. Engine (Vitest, `packages/game-engine/tests`)

| Case                                | Expected                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Deal sizes                          | 5 cards at 2–4 players, 4 at 5–8; deck 64 conserved                                                                  |
| Draw Then Play — legal drawn card   | may be played; ability resolves; win if it empties the hand                                                          |
| Draw Then Play — illegal / declined | turn ends; counts as a pass for pile reset                                                                           |
| Only the drawn card                 | playing any other card after drawing → `cannot_play`                                                                 |
| Glue / Ruler on drawn card          | same legality as hand cards; Ruler forced pass recorded                                                              |
| Empty draw pile                     | reshuffle; nothing to draw → pass                                                                                    |
| No loops                            | after a draw, at most one play; property test over 10,000 random games                                               |
| Alarm (P1)                          | reverse; only the new next player draws 1; Umbrella blocks                                                           |
| Ruleset 7                           | old matches still replay with ruleset 7                                                                              |
| Simulation                          | `tests/integration/quick-match-sim.test.ts` smoke in CI; full run before release (100 % finished, metrics within §5) |

## 2. Server / multiplayer (integration + backend tests)

| Case                                           | Expected                                                          |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| Timeout while choosing card / ability / target | auto draw, turn ends, no partial effect                           |
| Timeout after drawing                          | card kept, turn ends                                              |
| Command at deadline − 0.2 s / + 0.3 s / + 1 s  | accepted / accepted (grace) / rejected                            |
| Accepted command processed past the deadline   | completes; no timeout applied twice                               |
| Umbrella 5 s timeout                           | declined                                                          |
| 2 timeouts in a row (Online)                   | seat goes auto-play; next command from the player returns control |
| Disconnect + rejoin mid-turn                   | view shows the right deadline; player can act                     |
| Concurrent commands                            | one wins (row lock); idempotent retries                           |
| Hidden info                                    | drawn card visible only to its owner; peeks private               |

## 3. UI (Playwright, iPhone SE + Pro Max)

Draw Then Play prompt; 5 s warning (visual + sound); popups close on timeout with a message; rematch button; 2 / 4 / 8 players fit without overflow; reduced motion; a11y (axe) clean.

## 4. Human playtest (owner, Dev)

| Session | Players                | Rounds | Record                         |
| ------- | ---------------------- | ------ | ------------------------------ |
| P1      | 2 (Online, two phones) | 5      | round time, timeouts, comments |
| P2      | 4 (friends + bots)     | 5      | same                           |
| P3      | 6–8 (friends + bots)   | 5      | same + longest wait            |
| P4      | Solo vs 3 / 7 bots     | 5 each | same                           |

Measured automatically (to add with implementation): round duration, decision time per turn, timeouts per player, Draw Then Play usage, rematch rate. Survey per session (1–5): fun, speed, fairness, clarity, "อยากเล่นต่อไหม".

**Actual Human Playtest Results:** _none yet._

## 5. Release criteria for Quick Match

- Simulation: 100 % of games finish; 8 players p90 ≤ 120 turns.
- Playtest: median round 5–10 min for 4–8 players; ≤ 10 % of rounds over 15 min; timeouts ≤ 1 per player per round on average; fun and speed ≥ 4 / 5.
- All tests above green in CI; no rule mismatch between engine, docs and UI.
