# AumMon — Game Design Upgrade Plan (9–10 Quality)

> Task 12.13 · Direction (approved by the owner):
>
> - Fast Tactical Party Card Game · Quick Match First · 5–10 min · 20 s turns · 2–8 players.
> - First to empty the hand wins · 16 everyday-object cards.
> - **Easy to Learn, Fun to Play, Hard to Master.**

## 1. Status of every rule change

| Status                      | Items                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Existing Approved Rules** | ruleset "8": DC1–DC9 incl. Quick Match QM1–QM6 (hands 5 / 4, Draw Then Play, 20 s / 5 s, auto-play, Alarm next-only, rematch) |
| **Proposed Changes**        | S2–S4 text / UI (no rule change); S5 = B3A Trash; S6 = B6B Box; S7 Flashlight 3 s; B4B Magnifier; B5A Hourglass UI            |
| **Simulated Changes**       | B1 Key 7 → 6; B2A Umbrella 8 → 7; B3A Trash remove-only; balance pack (all three)                                             |
| **Playtested Changes**      | none yet                                                                                                                      |
| **Approved Final Rules**    | = Existing Approved Rules until the owner approves more                                                                       |

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

| ID  | Decision                                                                                                                             | Recommendation                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Q1  | Balance pack: กุญแจ 6 points, ร่ม 7 points, ถังขยะ "remove 1 card, no redraw" → ruleset "9"                                             | Approve (simulated: shorter rounds, fairer Key / Trash) |
| Q2  | Simulate B4B (Magnifier: peek + play 1 more) and B6B (Box: put 1 card on the pile) before deciding                                   | Approve simulation                                      |
| Q3  | UI-only items (no rule change): tutorial, 4-line rules, short card text, Glue text "1–3", Hourglass hint, last-card badge, telemetry | Approve to build next                                   |
| Q4  | Flashlight reveal 5 s → 3 s                                                                                                          | Optional                                                |

Nothing in this plan changes the win condition or the turn structure.
