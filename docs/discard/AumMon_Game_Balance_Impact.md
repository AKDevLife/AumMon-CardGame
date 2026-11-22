# AumMon — Game Balance Impact (Quick Match)

> Task 12.11 · Status: **review + PROPOSALS — no card changed** (card changes need owner approval and a new `ruleset_version`).
> Data: ablation in `AumMon_Game_Simulation_Report.md` §3 (Δ turns = with the ability − ability never used; positive = longer games) and card win rates in `AumMon_Card_Balance.md`.

## 1. Classification

| Class                      | Cards                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| Fast gameplay              | เทปกาว, กรรไกร, กล่องกระดาษ, ถังขยะ, แม่เหล็ก, นาฬิกาทราย (8p)             |
| Neutral                    | ยางลบ, แว่นขยาย, กุญแจ, ร่ม                                              |
| Slow (mild)                | กาวน้ำ, ไม้บรรทัด, หนังยาง                                                |
| Potentially game-extending | **นาฬิกาปลุก** (strong), ไฟฉาย, พัดลม                                    |
| Potentially unbalanced     | เทปกาว (very strong shedding, win 29.7 %), กุญแจ (win 31.8 %, highest) |

## 2. Card by card

| Card         | Pts | Current ability                         | Duration (Δ turns 4p / 8p) | Hand sizes                 | Turns             | Fairness                         | Proposal                                                                 |
| ------------ | --: | --------------------------------------- | -------------------------- | -------------------------- | ----------------- | -------------------------------- | ------------------------------------------------------------------------ |
| หนังยาง       |   2 | next player draws 1                     | +3.6 / +2.5                | +1 to one player           | slightly more     | fine                             | keep                                                                     |
| กาวน้ำ        |   3 | chosen player cannot play < 4 next turn | +1.4 / +1.2                | indirect (forced draws)    | slightly more     | fine                             | keep                                                                     |
| ยางลบ        |   1 | wild, clears pile conditions            | +0.3 / −0.4                | −1 self                    | neutral           | fine                             | keep                                                                     |
| กรรไกร       |   4 | remove card below, play 1 more          | −2.8 / −13.2               | −2 self                    | fewer             | fine                             | keep                                                                     |
| กล่องกระดาษ   |   3 | card below → hand, place another        | −2.3 / −7.5                | ±0 self, resets pile value | fewer             | fine                             | keep                                                                     |
| **นาฬิกาปลุก** |   5 | reverse + **all others draw 1**         | **+10.3 / +27.1**          | +(players−1) cards         | many more at 6–8p | punishes the table, not a target | **P1: reverse + only the next player (new direction) draws 1**           |
| แม่เหล็ก       |   4 | give 1 card to the player with fewest   | −0.8 / −3.6                | −1 self, +1 leader         | fewer             | catch-up                         | keep                                                                     |
| แว่นขยาย      |   2 | peek 2 cards                            | −0.2 / +1.2                | none                       | neutral           | weakest (21 %)                   | keep (earlier idea "target also draws 1" would lengthen games — dropped) |
| ไม้บรรทัด      |   5 | next player must play exactly 5         | +1.2 / +4.3                | +1 often                   | more              | fine                             | keep; watch                                                              |
| เทปกาว       |   6 | also play 2 equal-point cards           | −28.7 / −33.4              | −3 self                    | far fewer         | strongest shedder                | keep (it is the "fast" card; watch win rate)                             |
| ถังขยะ        |   1 | discard 1, draw 1                       | −1.1 / −4.1                | ±0                         | slightly fewer    | fine                             | keep                                                                     |
| ไฟฉาย        |   6 | reveal all hands, chosen player draws 1 | +3.3 / +9.7                | +1 one player              | more              | fine                             | keep; watch at 6–8p (reveal popup also costs time → P3)                  |
| กุญแจ         |   7 | skip next player                        | −1.5 / +0.7                | none                       | neutral           | strongest win rate               | keep for now (earlier idea 7 → 6 stays on the list)                      |
| พัดลม         |   4 | fewest-cards player draws 1             | +5.2 / +6.5                | +1 leader                  | more              | catch-up (anti-snowball)         | keep — catch-up is part of the party feel                                |
| นาฬิกาทราย    |   3 | repeat ability below                    | −0.7 / −4.0                | depends                    | neutral           | fine                             | keep                                                                     |
| ร่ม           |   8 | reaction: cancel draw / skip on you     | −0.1 / −0.2                | −1 self                    | neutral           | fine                             | keep; reaction timer 8 s → 5 s                                           |

## 3. Proposals for the owner

| ID         | Change                                                                                                 | Why                                                                                                                                                        | Impact (simulation)                           | Ruleset                     |
| ---------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------- |
| **P1**     | **นาฬิกาปลุก**: "สลับทิศทางการเล่น แล้วผู้เล่นคนถัดไป (ตามทิศใหม่) จั่ว 1 ใบ"                                        | "All others draw" grows with players and is the main 6–8 player extender; the new text keeps the card's identity (reverse + wake-up call) and stays strong | 8p mean 80 → 54 turns, p90 177 → 111 (E vs D) | needs `ruleset_version` "8" |
| P2 (watch) | กุญแจ 7 → 6                                                                                             | highest win rate                                                                                                                                           | not simulated for Quick Match yet             | "8" if applied              |
| P3         | Flashlight reveal 5 s → 3 s (card text says 5 s → needs approval); UI: shorter animations on bot turns | waiting time at 6–8 players                                                                                                                                | not simulated (time only)                     | text change with "8"        |

No ability is removed or made riskless; every card keeps its role.
