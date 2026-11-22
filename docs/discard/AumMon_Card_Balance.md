# AumMon — Casual Discard Edition · Card Balance (Phase 3)

> Source: engine `packages/game-engine/src/discard` (ruleset "7") with the normal bot, 2,000 games per player count (task 12.2).
> Status: **measurements + PROPOSED tweaks — nothing changed yet** (card changes need owner approval). Quick Match duration impact per card: `AumMon_Game_Balance_Impact.md`.

## Game health

| Players | Games finished | Avg turns | Longest | First player wins (fair) | Umbrella uses / game | Pile resets / game |
| ------: | -------------: | --------: | ------: | -----------------------: | -------------------: | -----------------: |
|       2 |          100 % |        14 |      33 |              55 % (50 %) |                  0.8 |                2.2 |
|       3 |          100 % |        23 |      48 |              36 % (33 %) |                  1.3 |                1.6 |
|       4 |          100 % |        34 |      99 |              28 % (25 %) |                  1.8 |                1.5 |
|       5 |          100 % |        30 |     117 |              23 % (20 %) |                  1.5 |                1.0 |
|       6 |          100 % |        40 |     254 |              19 % (17 %) |                  2.1 |                0.9 |
|       7 |          100 % |        48 |     282 |              17 % (14 %) |                  2.7 |                0.8 |
|       8 |          100 % |        57 |     293 |              15 % (13 %) |                  3.7 |                0.6 |

Findings: with the pile reset (DC1) every game ends; going first is a small edge (+3–5 points) — acceptable for a casual game. Rare long games at 6–8 players (draw effects pile up) → watch in playtest; a turn timer keeps real games moving.

## Card strength (4 players, win rate when the card is in the opening hand; fair = 25 %)

| Card       | Pts | Win % | Note                                         |
| ---------- | --: | ----: | -------------------------------------------- |
| กุญแจ       |   7 |  31.8 | Strongest: high points (easy to play) + skip |
| ร่ม         |   8 |  30.6 | Defence + 8                                  |
| เทปกาว     |   6 |  29.7 | Sheds 3 cards                                |
| นาฬิกาปลุก   |   5 |  28.0 | Everyone else draws                          |
| แม่เหล็ก     |   4 |  27.3 | Sheds 1 extra card                           |
| ไฟฉาย      |   6 |  26.7 |                                              |
| ไม้บรรทัด    |   5 |  24.1 |                                              |
| ยางลบ      |   1 |  23.8 |                                              |
| กรรไกร     |   4 |  23.6 |                                              |
| พัดลม       |   4 |  23.4 |                                              |
| หนังยาง     |   2 |  22.2 |                                              |
| ถังขยะ      |   1 |  22.0 |                                              |
| กาวน้ำ      |   3 |  22.0 |                                              |
| นาฬิกาทราย  |   3 |  21.8 |                                              |
| กล่องกระดาษ |   3 |  21.5 |                                              |
| แว่นขยาย    |   2 |  21.1 | Information only                             |

Spread 21–32 % — no broken card. Pattern: high-point cards are both easier to play and stronger.

## Proposed tweaks (for the owner after playtest — not applied)

1. **กุญแจ 7 → 6** or limit to 2 copies: strongest card.
2. **แว่นขยาย**: after peeking, the target also draws 1 — the weakest card gets a small hit.
3. **นาฬิกาทราย / กล่องกระดาษ**: fine thematically; re-measure after real play (bots underuse them).
4. Keep watching 6–8 player game length; if too long, cap hand draws or shorten the timer.
