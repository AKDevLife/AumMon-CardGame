# AumMon — Game Duration Analysis

> Task 12.11 · Status: **analysis** (no rule changed). Data: `AumMon_Game_Simulation_Report.md` (simulation + time model, not human playtests).
> Owner target: **5–10 minutes per round**, **20 s decision time per turn**, Quick Match first.

## 1. What makes the current game long

| Cause                                                    | Evidence (simulation)                            | Effect                                                        |
| -------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| Starting hand 7 (2–4 players) / 5 (5–8)                  | B vs A: −25–35 % turns at every size             | More cards to shed = more turns                               |
| **Alarm Clock** — everyone else draws 1                  | Ablation: +10 turns (4p), **+27 turns (8p)**     | Scales with player count; the main 6–8 player extender        |
| Other forced draws (Flashlight, Fan, Rubber Band, Ruler) | +3–10 turns each at 8p                           | Hands grow back after shedding                                |
| "Draw 1 and pass" with no legal card                     | Long streaks of passes at 6–8p; stalls 0.3–0.5 % | Turns that change nothing                                     |
| 45 s timer                                               | Slow decisions are allowed to take 45 s          | Long waits between own turns (p90 longest wait 3–4 min at 8p) |
| Many players                                             | Rotation time grows linearly                     | 8 players = 7 other turns before yours                        |

Not a problem: pile reset (DC1) — it is what makes games finish; first-player edge is small (+2–5 points).

## 2. Current rules (A) — estimated minutes (model)

| Players | Median |  p90 | ≤ 10 min |
| ------: | -----: | ---: | -------: |
|       2 |    2.5 |  4.0 |    100 % |
|       3 |    4.4 |  7.2 |     98 % |
|       4 |    7.0 | 12.4 |     78 % |
|       5 |    5.8 | 15.4 |     75 % |
|       6 |    8.3 | 22.8 |     59 % |
|       7 |   10.8 | 29.7 |     46 % |
|       8 |   11.8 | 29.5 |     42 % |

## 3. Recommended Quick Match (E) — estimated minutes (model)

| Players | Median |  p90 | ≤ 10 min | Longest wait p90 |
| ------: | -----: | ---: | -------: | ---------------: |
|       2 |    1.8 |  3.4 |    100 % |             42 s |
|       3 |    3.1 |  6.1 |     99 % |             64 s |
|       4 |    4.3 |  9.4 |     92 % |             91 s |
|       5 |    3.9 | 10.8 |     89 % |            113 s |
|       6 |    4.6 | 13.8 |     82 % |            139 s |
|       7 |    5.5 | 16.0 |     76 % |            166 s |
|       8 |    5.8 | 16.6 |     72 % |            195 s |

## 4. Interpretation of the 5–10 minute target

- The model has no talking, reactions to events, or network delay. Real rounds will be longer; a common rule of thumb for casual party play is +30–60 %. With that, E lands around **2.5–4 min (2–3 players), 5–7 min (4–5 players), 6–9 min (6–8 players)** for a typical round — inside or close to the target. **This must be confirmed by playtest (Test Plan §4).**
- 2–3 player rounds are naturally shorter than 5 minutes. Quick Match makes that a feature: "เล่นอีกรอบ" (rematch) in one tap. Owner option: a 2–3 player match = best of 3 rounds.
- The remaining risk is the 6–8 player **tail** (p90 14–17 min): about 1 game in 5 still goes over 10 minutes in the model. Mitigations in the proposal: AFK auto-play, 20 s timer, Alarm change. If playtest still shows long tails: fallback X3 (4 / 3 cards).
