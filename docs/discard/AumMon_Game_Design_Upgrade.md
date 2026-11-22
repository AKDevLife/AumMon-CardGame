# AumMon — Game Design Upgrade Plan (9–10 Quality)

> Task 12.13 · Direction (approved by the owner):
>
> - Fast Tactical Party Card Game · Quick Match First · 5–10 min · 20 s turns · 2–8 players.
> - First to empty the hand wins · 16 everyday-object cards.
> - **Easy to Learn, Fun to Play, Hard to Master.**

## 1. Status of every rule change

| Status                      | Items                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Existing Approved Rules** | ruleset "9": DC1–DC10 — Quick Match QM1–QM6 + balance pack (Key 6, Umbrella 7, Trash no redraw) + Flashlight 3 s   |
| **Proposed Changes**        | S2–S4 text / UI (no rule change); S5 = B3A Trash; S6 = B6B Box; S7 Flashlight 3 s; B4B Magnifier; B5A Hourglass UI |
| **Simulated Changes**       | B1 Key 7 → 6; B2A Umbrella 8 → 7; B3A Trash remove-only; balance pack (all three)                                  |
| **Playtested Changes**      | none yet                                                                                                           |
| **Approved Final Rules**    | = Existing Approved Rules until the owner approves more                                                            |

## 2. Phases

| Phase                          | Work                                        | Status                          | Output                                                     |
| ------------------------------ | ------------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| 1 Audit                        | rules, cards, UX, data                      | **done**                        | `AumMon_Game_Quality_Audit.md`                             |
| 2 Rule Simplification          | 4-line summary, text fixes, complexity list | **proposed**                    | `AumMon_Rule_Simplification.md`                            |
| 3 Card Balance                 | scorecard, B1–B6 options, ability standard  | **proposed / partly simulated** | `AumMon_Card_Balance_Review.md`                            |
| 4 Quick Match Simulation       | full metrics on ruleset 8 + proposals       | **done**                        | `AumMon_Game_Simulation_Report.md` §6                      |
| 5 Tutorial & UX                | tutorial, tooltips, UX gaps                 | **designed**                    | `AumMon_Tutorial_Design.md`, `AumMon_Player_Experience.md` |
| 6 Human Playtest               | 3 groups, questionnaire, telemetry          | **protocol ready**              | `AumMon_Playtest_Protocol.md`                              |
| 7 Approved Rule Implementation | after the owner approves                    | waiting                         | new ruleset "9" if any result-affecting change             |
| 8 Final Quality Assessment     | scorecard with human data                   | waiting                         | `AumMon_Game_Quality_Report.md`                            |

## 3. Decisions for the owner

**2026-11-22: the owner approved Q1–Q4 ("อนุมัติทั้งหมด").** Q1 + Q4 shipped as ruleset "9" (task 12.14). Q2 simulation results are in §4. Q3 is being built (tasks 12.15 / 12.16).

| ID  | Decision                                                                                                                             | Recommendation                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Q1  | Balance pack: กุญแจ 6 points, ร่ม 7 points, ถังขยะ "remove 1 card, no redraw" → ruleset "9"                                             | Approve (simulated: shorter rounds, fairer Key / Trash) |
| Q2  | Simulate B4B (Magnifier: peek + play 1 more) and B6B (Box: put 1 card on the pile) before deciding                                   | Approve simulation                                      |
| Q3  | UI-only items (no rule change): tutorial, 4-line rules, short card text, Glue text "1–3", Hourglass hint, last-card badge, telemetry | Approve to build next                                   |
| Q4  | Flashlight reveal 5 s → 3 s                                                                                                          | Optional                                                |

Nothing in this plan changes the win condition or the turn structure.

## 4. Q2 results (simulated on ruleset "9", 2,000 rounds per row; emulated in the harness)

| Config                                           | Players | Mean turns | Est. min median / p90 | ≤ 10 min | Win index range | แว่นขยาย | กล่องกระดาษ | First player wins |
| ------------------------------------------------ | ------: | ---------: | --------------------- | -------: | --------------- | ------: | ---------: | ----------------: |
| R9 shipped                                       |       2 |         12 | 1.7 / 3.2             |    100 % | 0.85–1.15       |    0.85 |       0.85 |              56 % |
| R9 shipped                                       |       4 |         31 | 3.9 / 8.6             |     94 % | 0.75–1.38       |    0.75 |       0.85 |              26 % |
| R9 shipped                                       |       6 |         36 | 3.9 / 11.6            |     87 % | 0.65–1.53       |    0.68 |       0.77 |              21 % |
| R9 shipped                                       |       8 |         41 | 4.8 / 12.6            |     84 % | 0.67–1.57       |    0.71 |       0.82 |              16 % |
| R9 + Magnifier peek & play 1 more (proposal B4B) |       2 |         11 | 1.6 / 2.9             |    100 % | 0.86–1.13       |    0.95 |       0.86 |              56 % |
| R9 + Magnifier peek & play 1 more (proposal B4B) |       4 |         29 | 3.6 / 7.9             |     95 % | 0.79–1.35       |    0.89 |       0.87 |              27 % |
| R9 + Magnifier peek & play 1 more (proposal B4B) |       6 |         34 | 3.8 / 10.4            |     89 % | 0.71–1.55       |    0.85 |       0.81 |              19 % |
| R9 + Magnifier peek & play 1 more (proposal B4B) |       8 |         39 | 4.6 / 11.9            |     86 % | 0.63–1.55       |    0.88 |       0.84 |              17 % |
| R9 + Box put 1 card on the pile (proposal B6B)   |       2 |         11 | 1.5 / 2.9             |    100 % | 0.82–1.14       |    0.82 |       0.99 |              58 % |
| R9 + Box put 1 card on the pile (proposal B6B)   |       4 |         27 | 3.4 / 7.3             |     97 % | 0.75–1.38       |    0.75 |       1.11 |              27 % |
| R9 + Box put 1 card on the pile (proposal B6B)   |       6 |         31 | 3.5 / 9.6             |     91 % | 0.66–1.54       |    0.67 |       1.15 |              22 % |
| R9 + Box put 1 card on the pile (proposal B6B)   |       8 |         35 | 4.2 / 10.5            |     89 % | 0.62–1.65       |    0.62 |       1.28 |              17 % |

| Proposal                                                                       | Effect                                                                                       | Recommendation                                                                                         |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **B4B แว่นขยาย** — peek at 2 cards, then you may play 1 more card (points rule) | Magnifier 0.75 → 0.89 (4p), 0.71 → 0.88 (8p); rounds a little shorter; other cards unchanged | **Approve** → ruleset "10"                                                                             |
| **B6B กล่องกระดาษ** — put 1 card from your hand on the pile (no ability)        | Box 0.85 → 1.11 (4p) and **1.28 (8p)** — overshoots; rounds shorter (8p ≤ 10 min 84 → 89 %)  | **Not as is.** Option: only a card with points ≤ the Box's (3), or keep the current Box with a UI hint |
