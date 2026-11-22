# AumMon — Card Balance Review (Phase 3)

> Task 12.13 · Status: **review + PROPOSALS — no card changed.** Ruleset "8" is the baseline. Earlier history: `AumMon_Card_Balance.md` (ruleset 7) and `AumMon_Game_Balance_Impact.md` (Quick Match).
> Measured (simulation, 2,000 rounds per player count) = **Win index** (win rate of a seat holding the card in its opening hand ÷ fair rate; 1.00 = fair), **ability uses per round**, **Δ turns** when the ability is never used (positive = the ability lengthens games).
> Rated **(designer estimate, 1–10)** = Understandability, Strategic value, Fun, Synergy — to be replaced by playtest answers.

## 1. Measured data

| Card       | Pts | Ability uses / round (2p / 4p / 8p) | Win index 2p | Win index 4p | Win index 8p | Δ turns if ability unused (4p / 8p) |
| ---------- | --: | ----------------------------------- | -----------: | -----------: | -----------: | ----------------------------------- |
| หนังยาง     |   2 | 0.47 / 0.86 / 0.92                  |         0.99 |         0.90 |         0.71 | +2.5 / +1.9                         |
| กาวน้ำ      |   3 | 0.53 / 1.15 / 1.11                  |         0.93 |         0.84 |         0.78 | +0.9 / +0.7                         |
| ยางลบ      |   1 | 0.80 / 2.58 / 5.00                  |         1.08 |         1.05 |         1.23 | +0.2 / +0.6                         |
| กรรไกร     |   4 | 0.39 / 0.76 / 0.82                  |         0.90 |         0.96 |         0.94 | -0.8 / -3.9                         |
| กล่องกระดาษ |   3 | 0.46 / 0.97 / 0.96                  |         0.86 |         0.87 |         0.76 | -1.4 / -3.9                         |
| นาฬิกาปลุก   |   5 | 0.66 / 1.61 / 2.23                  |         1.03 |         1.03 |         0.97 | +2.7 / +3.3                         |
| แม่เหล็ก     |   4 | 0.55 / 1.21 / 1.32                  |         1.15 |         1.15 |         1.26 | +0.4 / -2.0                         |
| แว่นขยาย    |   2 | 0.56 / 0.97 / 1.02                  |         0.84 |         0.80 |         0.69 | +0.4 / -0.7                         |
| ไม้บรรทัด    |   5 | 0.77 / 1.62 / 2.15                  |         1.04 |         0.97 |         0.95 | +1.5 / +1.9                         |
| เทปกาว     |   6 | 0.35 / 1.09 / 1.37                  |         1.10 |         1.29 |         1.45 | -14.6 / -21.1                       |
| ถังขยะ      |   1 | 0.43 / 0.75 / 0.91                  |         0.87 |         0.76 |         0.63 | +0.3 / -1.4                         |
| ไฟฉาย      |   6 | 0.71 / 1.79 / 2.57                  |         1.09 |         1.05 |         1.10 | +3.8 / +3.9                         |
| กุญแจ       |   7 | 0.79 / 2.02 / 3.28                  |         1.13 |         1.22 |         1.29 | -1.3 / -3.0                         |
| พัดลม       |   4 | 0.57 / 1.21 / 1.26                  |         0.95 |         0.95 |         0.82 | +3.1 / +3.3                         |
| นาฬิกาทราย  |   3 | 0.48 / 0.94 / 0.99                  |         0.93 |         0.83 |         0.74 | +0.7 / +0.1                         |
| ร่ม         |   8 | reaction                            |         1.08 |         1.37 |         1.58 | -0.0 / +0.1                         |

Umbrella is a reaction: its use is counted as blocked hits (0.3–3.4 per round), not as an ability.

## 2. Scorecard

U = Understandability, S = Strategic value, F = Fun, Syn = Synergy — all **designer estimates**. Frequency, Duration and Fairness come from the data above.

| Card       |     U |     S |   F | Freq.    | Duration impact | Fairness (win index 4p) | Syn | Verdict                                                |
| ---------- | ----: | ----: | --: | -------- | --------------- | ----------------------: | --: | ------------------------------------------------------ |
| หนังยาง     |    10 |     5 |   7 | medium   | slows a little  |                    0.90 |   6 | OK                                                     |
| กาวน้ำ      |     8 |     6 |   7 | medium   | neutral         |                    0.84 |   6 | slightly weak                                          |
| ยางลบ      |     9 |     8 |   8 | **high** | neutral         |                    1.05 |   9 | OK — the "answer" card                                 |
| กรรไกร     |     7 |     7 |   8 | medium   | speeds up       |                    0.96 |   7 | OK; text a bit long                                    |
| กล่องกระดาษ | **5** |     5 |   6 | medium   | speeds up       |                    0.86 |   5 | **complex + weak**                                     |
| นาฬิกาปลุก   |     9 |     7 |   9 | high     | slows a little  |                    1.03 |   7 | OK after QM5                                           |
| แม่เหล็ก     |     8 |     7 |   8 | medium   | neutral         |                    1.16 |   7 | strong but fine (gives to the leader)                  |
| แว่นขยาย    |     9 | **3** |   6 | medium   | neutral         |                **0.80** |   4 | **weak** — information only                            |
| ไม้บรรทัด    |     8 |     7 |   7 | high     | slows a little  |                    0.97 |   6 | OK                                                     |
| เทปกาว     |     8 |     9 |   9 | medium   | **much faster** |                    1.29 |   8 | strong — the "combo" hero card; keep                   |
| ถังขยะ      |     9 | **3** |   5 | low      | neutral         |                **0.76** |   4 | **weakest** — net zero cards                           |
| ไฟฉาย      |     8 |     7 |   9 | high     | slows           |                    1.06 |   6 | OK (fun reveal)                                        |
| กุญแจ       |    10 |     8 |   7 | **high** | neutral         |                    1.22 |   6 | **strong** (7 points = easy to play + skip)            |
| พัดลม       |     9 |     5 |   7 | medium   | slows           |                    0.94 |   5 | OK (anti-leader)                                       |
| นาฬิกาทราย  | **5** |     6 |   7 | medium   | neutral         |                    0.83 |   8 | **complex + weak**                                     |
| ร่ม         |     8 |     8 |   9 | reaction | neutral         |                **1.37** |   7 | **strongest** (8 points + defence + sheds out of turn) |

## 3. Proposals (at least two options each)

| ID  | Card       | Option A                                                                                      | Option B                                                                                                      | Simulated?                | Pros / cons                                                                                               | Recommendation                                          |
| --- | ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| B1  | กุญแจ       | **Points 7 → 6**                                                                              | Keep 7; a skipped player draws nothing but the pile resets for them                                           | A: yes                    | A: win index 1.22 → 1.12 (4p); 8-player mean turns 53 → 45; identity kept. B: more rules.                 | **A**                                                   |
| B2  | ร่ม         | **Points 8 → 7**                                                                              | When used as a reaction, Umbrella is placed **under** the top card (it blocks but does not set the pile to 8) | A: yes                    | A: 1.37 → 1.28 (4p) but other strong cards rise. B: removes the out-of-turn tempo spike; more to explain. | **A** now; B if playtest shows Umbrella still dominates |
| B3  | ถังขยะ      | **Remove 1 card from the game — no redraw**                                                   | Discard 1 and draw 1, then play 1 more card (points rule)                                                     | A: yes                    | A: 0.76 → 0.87 (4p); 4–8p rounds shorter; text shorter. B: two steps.                                     | **A**                                                   |
| B4  | แว่นขยาย    | Peek at 2 cards of a player, **then that player draws 1 if they have fewer cards than you**   | Peek at 2 cards, **then you may play 1 more card** (points rule)                                              | no (needs an engine hook) | A: hurts the leader, keeps the spy theme; slows a little. B: faster and stronger; two steps.              | **B** (speeds rounds), simulate first                   |
| B5  | นาฬิกาทราย  | Keep "repeat the ability under it"; the UI shows which ability will repeat before you confirm | "ย้อนเวลา: play again — you take one more turn now"                                                            | no                        | A: no rule change, fixes comprehension through UI. B: simple and strong.                                  | **A** (UI only)                                         |
| B6  | กล่องกระดาษ | "Take the card below into your hand" (one step; Box stays on the pile)                        | "Put 1 card from your hand on the pile (no ability)" — a single extra shed                                    | no                        | A: simplest wording, but makes your hand bigger. B: simple, speeds the round, overlaps Tape a little.     | **B**, simulate first                                   |

**Balance pack (B1 + B2A + B3A), simulated together:**

- Mean turns at 8 players: 53 → 41.
- Rounds ≤ 10 min at 8 players: 74 % → 83 %.
- Key and Trash move toward fair.
- Umbrella and Tape stay strong (1.33–1.58), so the win-index spread barely narrows.

Next: simulate B4B and B6B, then playtest. Table C in `AumMon_Game_Simulation_Report.md` §6.

## 4. Ability standard (Phase 3 format)

Groups: **Instant** (resolves now) · **Target** (you choose a player) · **Rule Effect** (changes what can be played next) · **Defense** (reaction).

| Card       | Group         | Trigger                                   | Effect                                                                           | Target                         | Duration            | Timing                                             | Restrictions                           | Interactions                              |
| ---------- | ------------- | ----------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------ | ------------------- | -------------------------------------------------- | -------------------------------------- | ----------------------------------------- |
| หนังยาง     | Instant       | after you play it, if you use the ability | next player draws 1                                                              | next player                    | instant             | before the win check of others; Umbrella may block | —                                      | Hourglass repeats it                      |
| กาวน้ำ      | Target · Rule | same                                      | the target cannot play 1–3 points on their next turn                             | chosen player                  | their next turn     | when they act                                      | Eraser removes it                      | Draw Then Play: applies to the drawn card |
| ยางลบ      | Rule          | play                                      | the next player may play any points; clears Glue / Ruler                         | pile                           | until the next play | at once                                            | playable on any card                   | answers Ruler / Glue                      |
| กรรไกร     | Instant       | ability                                   | remove the card under it from the game; you may play 1 more card (points rule)   | pile / you                     | instant             | at once                                            | the extra card follows the normal rule | the extra card's ability may be used      |
| กล่องกระดาษ | Instant       | ability                                   | the card under it goes to your hand; place another hand card on top (no ability) | pile / you                     | instant             | at once                                            | must place a card                      | the placed card becomes the new top       |
| นาฬิกาปลุก   | Instant       | ability                                   | reverse direction; the next player (new direction) draws 1                       | next player                    | instant             | Umbrella may block                                 | —                                      | —                                         |
| แม่เหล็ก     | Target (auto) | ability                                   | give 1 of your cards to the player with the fewest cards                         | fewest cards (tie: turn order) | instant             | at once                                            | —                                      | can make the leader's hand bigger         |
| แว่นขยาย    | Target        | ability                                   | you secretly see 2 random cards of the target                                    | chosen player                  | instant             | at once                                            | private to you                         | —                                         |
| ไม้บรรทัด    | Rule          | ability                                   | the next player must play exactly 5 (or Eraser) or pass                          | next player                    | their next turn     | when they act                                      | Umbrella / Eraser answer it            | Draw Then Play: the drawn card must be 5  |
| เทปกาว     | Instant       | ability                                   | also play 2 cards with equal points (any points)                                 | you                            | instant             | at once                                            | needs a pair                           | can win at once                           |
| ถังขยะ      | Instant       | ability                                   | remove 1 hand card from the game, draw 1                                         | you                            | instant             | at once                                            | —                                      | —                                         |
| ไฟฉาย      | Target        | ability                                   | everyone sees all hands for 5 s; chosen player draws 1                           | all + chosen                   | instant             | Umbrella may block the draw                        | —                                      | —                                         |
| กุญแจ       | Instant       | ability                                   | the next player's turn is skipped                                                | next player                    | 1 turn              | Umbrella may block                                 | —                                      | —                                         |
| พัดลม       | Target (auto) | ability                                   | the player with the fewest cards (not you) draws 1                               | fewest cards                   | instant             | Umbrella may block                                 | —                                      | anti-leader                               |
| นาฬิกาทราย  | Instant       | ability                                   | repeat the ability of the card under it                                          | as that ability                | as that ability     | at once                                            | never repeats Hourglass / Umbrella     | —                                         |
| ร่ม         | Defense       | you would draw or be skipped by an effect | cancel it for you; Umbrella goes on the pile                                     | you                            | instant             | out of turn, 5 s                                   | —                                      | also a normal 8 on your turn              |
