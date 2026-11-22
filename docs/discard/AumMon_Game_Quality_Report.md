# AumMon — Game Quality Report (Phase 8 scorecard)

> Task 12.13 · Updated: 2026-11-22. Status bands: **Green 8.5–10 · Yellow 7.0–8.4 · Red < 7.0**.
> **Simulation Score** = from simulation data only (where a simulation can say anything).
> **Designer Estimate** = expert judgement, NOT evidence.
> **Human Playtest Score** = the only score that can make a category Green (`AumMon_Playtest_Protocol.md`).

## 1. Scorecard

| Category           | Target | Simulation Score                                                                 |                    Designer Estimate | Human Playtest Score | Status                           |
| ------------------ | -----: | -------------------------------------------------------------------------------- | -----------------------------------: | -------------------- | -------------------------------- |
| Fun                |    9.5 | n/a (cannot be simulated)                                                        |                                  7.5 | —                    | **Unproven**                     |
| Ease of Play       |    9.5 | n/a                                                                              |                                  8.0 | —                    | **Unproven**                     |
| Rule Comprehension |    9.5 | n/a                                                                              |   7.0 (no tutorial; 3 complex cards) | —                    | **Unproven — likely Yellow**     |
| Card Appeal        |    9.0 | n/a                                                                              |     6.5 (emoji art, art not started) | —                    | **Unproven — likely Red/Yellow** |
| Game Balance       |    9.0 | 7.5 (win index 0.63–1.58; first player +2–5 points)                              |                                  7.5 | —                    | **Yellow (sim)**                 |
| Mobile UX          |    9.5 | n/a                                                                              |                                  8.0 | —                    | **Unproven**                     |
| Replayability      |    9.5 | n/a                                                                              | 8.0 (16 cards, 2–8 players, rematch) | —                    | **Unproven**                     |
| Game Duration      |    9.0 | 8.0 (model: median 4–6 min at 4–8 players, 74–91 % ≤ 10 min; p90 tail 10–16 min) |                                  8.0 | —                    | **Yellow (sim)**                 |

How the simulation scores were set:

- **Game Duration.** 10 = every player count has its median within 5–10 min (after the assumed overhead) and ≥ 90 % of rounds ≤ 10 min. Each player count that misses costs about 0.5.
- **Game Balance.** 10 = every card's win index is within 0.85–1.15 and the first-player edge is ≤ 2 points. The current 0.63–1.58 range sets it at 7.5.

## 2. Projected effect of the proposals (not approved)

| Change                                    | Categories expected to improve                                          | Evidence             |
| ----------------------------------------- | ----------------------------------------------------------------------- | -------------------- |
| Balance pack B1 + B2A + B3A               | Balance 7.5 → ~8.0; Duration 8.0 → ~8.5 (8 players ≤ 10 min: 74 → 83 %) | simulated            |
| B4B Magnifier, B6B Box                    | Balance, Comprehension                                                  | to simulate          |
| Tutorial + 4-line rules + short card text | Comprehension, Ease                                                     | needs playtest       |
| Card art (13.x)                           | Card Appeal                                                             | needs art + playtest |
| UX P1 / P2 items                          | Mobile UX, Fun                                                          | needs playtest       |

Conflicts found:

- Stronger fixes for Umbrella / Tape would narrow balance but could reduce Fun — the "big moments". Recommendation: keep them strong until players report them as unfair.
- B4B / B6B speed rounds up but add text (Comprehension). They will be judged in playtest.

## 3. Human playtest results

_None yet._ To be filled per `AumMon_Playtest_Protocol.md` §6.

## 4. Verdict today

No category can honestly be called Green yet. The path to Green:

1. Approve the balance pack.
2. Build the tutorial, short card texts, the last-card badge and telemetry.
3. Run 9+ playtest sessions.
4. Re-score.
