# AumMon — Game Quality Audit (Phase 1)

> Task 12.13 (owner brief "TASK 13.4 — 9–10 Quality Upgrade"; roadmap 13.x is the art phase, so this is tracked as 12.13).
> Scope: audit of the **approved production rules — ruleset "8" Quick Match** (`AumMon_Core_Rules.md`, `AumMon_Card_Library.md`, `AumMon_Quick_Match_Rules.md`) and the live game UI.
> Status: **analysis only — no production rule changed.**
> Evidence: simulation on the real engine (`AumMon_Game_Simulation_Report.md` §6), code review, and design judgement.
> Design judgement is always labelled **(designer estimate)**. Human data: none yet.

## 1. What is already in place

The brief's Quick Match items (§4: hands 5 / 4, 20 s timer, Draw Then Play) were approved (QM1–QM6) and **are live** since task 12.12. They are therefore audited here as Existing Approved Rules, not proposed again.

| Area              | Current state                                                                                                                              | Evidence                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Game always ends  | 100 % of 14,000 simulated rounds finish (2–8 players); no loops (Hourglass guard; at most one card after a draw)                           | simulation, engine tests |
| No stuck states   | Server timers resolve every wait (turn 20 s, Umbrella 5 s, drawn card ≥ 5 s); Online auto-play after 2 timeouts                            | integration tests        |
| Turn clarity (UI) | Header turn pill, glow on the active player, playable cards ringed green, reason shown for unplayable cards, 20 s timer turning red at 5 s | 12.9 / 12.12 UI          |
| Win condition     | First to empty the hand — unchanged                                                                                                        | Core Rules §8            |

## 2. Findings

| #   | Area          | Finding                                                                                                                                                                                                                                                 | Severity                       | Evidence       |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------- |
| F1  | Duration      | Median rounds fit the target at 4–8 players (model), but the **6–8 player tail** is still long: p90 13–16 min; only 74–83 % of rounds are ≤ 10 min                                                                                                      | High                           | Sim §6 table A |
| F2  | Duration      | 2–3 player rounds are short (median 1.8–3.0 min) — below 5 min by nature                                                                                                                                                                                | Low (rematch exists)           | Sim            |
| F3  | Balance       | Win index (1.00 = fair) spreads from **0.63 to 1.58** at 8 players. Strong at 4–8 players: **ร่ม** (1.37–1.58), **เทปกาว** (1.29–1.45), **กุญแจ** (1.22–1.38), แม่เหล็ก. Weak: **ถังขยะ** (0.63–0.87), **แว่นขยาย**, **นาฬิกาทราย**, **กาวน้ำ**, **กล่องกระดาษ** | Medium                         | Sim table B    |
| F4  | Fairness      | First player wins 55 % at 2 players (fair 50 %) and 27 % at 4 players (fair 25 %); the edge shrinks with more players                                                                                                                                   | Low                            | Sim table A    |
| F5  | Fairness      | Forced draws per round: 2 (2p) → 6.3 (8p); the p90 of hits on one player is 4–5; "hopeless" losers (≥ 2× starting hand) are 0.3–4.2 %                                                                                                                   | Low — no catch-up needed yet   | Sim table A    |
| F6  | Comprehension | Three cards need two steps or refer to another card: **กล่องกระดาษ** (take the card below + place another card), **นาฬิกาทราย** (repeat the ability under it), **กรรไกร** (remove + optional extra play)                                                  | Medium (designer estimate)     | Card Library   |
| F7  | Comprehension | Ability text on hand cards is cut off; the full text is only in the preview                                                                                                                                                                             | Medium                         | UI review      |
| F8  | Onboarding    | No tutorial; the rules are a text popup only                                                                                                                                                                                                            | High for "learn in 1–2 min"    | UI             |
| F9  | Mobile UX     | Choosing a target uses buttons with names in a dialog (an extra step); targets are not highlighted on the table itself                                                                                                                                  | Low                            | UI review      |
| F10 | Appeal        | Cards use emoji art (approved art pipeline not started — 13.2)                                                                                                                                                                                          | Medium for Card Appeal         | art docs       |
| F11 | Data          | No telemetry for round length, decisions or reasons for leaving → human scores cannot be measured yet                                                                                                                                                   | High (blocks the quality goal) | code           |

## 3. Quality status (honest)

Scores per category: `AumMon_Game_Quality_Report.md`. In short:

- **Nothing is proven Green.** Human playtest scores do not exist yet.
- Simulation supports Game Duration and Balance only partly (Yellow).
