# AumMon — Game Simulation Report (Quick Match)

> Task 12.11 (owner brief "TASK 13.3 — Quick Match First"; roadmap 13.x is the art phase, so this work is tracked as 12.11).
> Status: **analysis + PROPOSAL — not approved. Production rules (ruleset "7") are unchanged.**

## 1. Method

- Harness: `tests/integration/quick-match-sim.test.ts` — the **real engine** (`startGame`, `applyCommand`, `canPlay`, card data D01–D16). Variants are applied by the harness only; production code is unchanged.
- Trials: **2,000 games per configuration per player count** (8 configurations × 7 player counts = 112,000 games) + ablation **1,000 games × 16 cards × 2 player counts** (32,000 games) + 2,000 reference games. Seeds 1…N, reproducible.
- Reproduce (~2 min): `AUMMON_SIM=2000 AUMMON_SIM_OUT=/tmp/sim.json pnpm vitest run tests/integration/quick-match-sim.test.ts --testTimeout=1200000`. CI runs a 15-game smoke for every configuration.
- Players: every seat gets a random profile — **careful** (server bot logic), **casual** (random playable card, ability 75 %, random targets), **impulsive** (highest playable card, ability always), **slow** (bot logic, slow decisions). No perfect bots.
- Covered: starting hands, draw pile (reshuffle from the pile when empty), pile reset, play legality, all 16 abilities, forced draws, skips, direction changes, card removal, Umbrella reactions, wins, draw-pile exhaustion. A game not over after 3,000 actions counts as **not finished (stalled)**.
- Variants:
  - **Hand size** — surplus dealt cards go back into the draw pile, which is reshuffled.
  - **Draw Then Play** — if the drawn card is legal the player may play only that card, otherwise the turn ends. The drawn card is identical in both branches; at most one extra card, so no loop.
  - **Turn timer** — a decision longer than the timer becomes a server auto-draw & pass (the drawn card is never auto-played).
  - **Alarm next-only** — emulation of the card proposal in the Balance Impact report.

### Time model (ESTIMATE — not measured)

| Item                          | Value (assumption)                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision time                 | log-normal, median careful 7 s · casual 5.5 s · impulsive 3.5 s · slow 11 s (σ 0.5); × 1.3 when an ability with choices is used, × 0.8 for a plain play / draw |
| Draw Then Play                | + 2.5 s to look at the drawn card + 1 extra animation                                                                                                          |
| Server + animation per action | 1.0 s                                                                                                                                                          |
| Umbrella decision             | 2.5 s (slow 4 s), capped by the reaction timer                                                                                                                 |
| Not modelled                  | talking, network problems, reconnects, leavers, learning the rules                                                                                             |

**Simulation results ≠ human playtest results.** Minutes below are model estimates. Actual human playtest results: none yet (Test Plan §4).

## 2. Configurations

| ID                | Starting hand (2–4 / 5–8) | Draw Then Play   | Turn timer | Reaction timer | Card change                                   |
| ----------------- | ------------------------- | ---------------- | ---------- | -------------- | --------------------------------------------- |
| A current         | 7 / 5                     | no (draw & pass) | 45 s       | 8 s            | —                                             |
| B                 | 5 / 4                     | no               | 45 s       | 8 s            | —                                             |
| C                 | 5 / 4                     | yes              | 45 s       | 8 s            | —                                             |
| D                 | 5 / 4                     | yes              | 20 s       | 8 s            | —                                             |
| **E recommended** | 5 / 4                     | yes              | 20 s       | 5 s            | Alarm: reverse + only the next player draws 1 |
| X1                | 5 / 4                     | no               | 20 s       | 5 s            | —                                             |
| X2                | 4 / 3                     | yes              | 20 s       | 5 s            | —                                             |
| X3                | 4 / 3                     | yes              | 20 s       | 5 s            | Alarm next-only                               |

## 3. Results

| Config                               | Players | Finished % | Turns mean / p50 / p90 / max | Est. min p50 / p90 | ≤ 10 min % | Longest wait p90 (s) | First player wins % | Abilities / game | Cards drawn / game | Timeouts / game | DTP plays / game |
| ------------------------------------ | ------: | ---------: | ---------------------------- | ------------------ | ---------: | -------------------: | ------------------: | ---------------: | -----------------: | --------------: | ---------------: |
| A current                            |       2 |      100.0 | 16 / 15 / 24 / 52            | 2.5 / 4.0          |        100 |                   53 |                  53 |             11.7 |                6.0 |            0.04 |              0.0 |
| A current                            |       3 |      100.0 | 30 / 27 / 47 / 157           | 4.4 / 7.2          |         98 |                   78 |                  35 |             19.1 |               14.5 |            0.06 |              0.0 |
| A current                            |       4 |      100.0 | 50 / 43 / 84 / 306           | 7.0 / 12.4         |         78 |                  106 |                  25 |             29.5 |               28.3 |            0.09 |              0.0 |
| A current                            |       5 |      100.0 | 52 / 36 / 107 / 780          | 5.8 / 15.4         |         75 |                  128 |                  22 |             27.7 |               33.8 |            0.09 |              0.0 |
| A current                            |       6 |      100.0 | 75 / 52 / 152 / 771          | 8.3 / 22.8         |         59 |                  162 |                  19 |             38.4 |               51.7 |            0.12 |              0.0 |
| A current                            |       7 |       99.7 | 93 / 70 / 198 / 559          | 10.8 / 29.7        |         46 |                  196 |                  16 |             47.0 |               66.9 |            0.14 |              0.0 |
| A current                            |       8 |       99.5 | 98 / 75 / 199 / 661          | 11.8 / 29.5        |         42 |                  233 |                  14 |             48.8 |               71.4 |            0.17 |              0.0 |
| B hand 5/4                           |       2 |      100.0 | 12 / 11 / 18 / 40            | 1.7 / 2.9          |        100 |                   48 |                  53 |              7.9 |                4.4 |            0.03 |              0.0 |
| B hand 5/4                           |       3 |      100.0 | 21 / 18 / 37 / 110           | 3.0 / 5.4          |        100 |                   73 |                  36 |             12.9 |               10.6 |            0.04 |              0.0 |
| B hand 5/4                           |       4 |      100.0 | 33 / 26 / 60 / 236           | 4.3 / 9.3          |         92 |                   99 |                  28 |             18.7 |               19.0 |            0.05 |              0.0 |
| B hand 5/4                           |       5 |      100.0 | 38 / 25 / 78 / 407           | 4.0 / 11.6         |         86 |                  119 |                  24 |             19.5 |               24.4 |            0.07 |              0.0 |
| B hand 5/4                           |       6 |      100.0 | 55 / 32 / 123 / 821          | 5.1 / 18.1         |         75 |                  150 |                  19 |             27.4 |               38.4 |            0.07 |              0.0 |
| B hand 5/4                           |       7 |       99.9 | 68 / 39 / 154 / 2658         | 6.0 / 22.5         |         66 |                  184 |                  17 |             32.6 |               48.8 |            0.11 |              0.0 |
| B hand 5/4                           |       8 |       99.8 | 76 / 48 / 175 / 609          | 7.4 / 26.8         |         60 |                  220 |                  14 |             36.4 |               56.6 |            0.11 |              0.0 |
| C 5/4 + DTP                          |       2 |      100.0 | 12 / 11 / 18 / 37            | 1.8 / 3.1          |        100 |                   49 |                  54 |              8.3 |                4.9 |            0.03 |              0.7 |
| C 5/4 + DTP                          |       3 |      100.0 | 22 / 19 / 39 / 126           | 3.1 / 6.0          |         99 |                   74 |                  37 |             14.2 |               12.3 |            0.04 |              1.9 |
| C 5/4 + DTP                          |       4 |      100.0 | 37 / 28 / 70 / 285           | 4.6 / 10.8         |         88 |                  101 |                  27 |             22.2 |               23.6 |            0.06 |              3.4 |
| C 5/4 + DTP                          |       5 |      100.0 | 41 / 26 / 85 / 478           | 4.4 / 12.9         |         83 |                  123 |                  25 |             22.9 |               29.0 |            0.07 |              3.9 |
| C 5/4 + DTP                          |       6 |       99.9 | 54 / 33 / 118 / 814          | 5.2 / 17.9         |         73 |                  155 |                  20 |             29.6 |               40.5 |            0.08 |              5.4 |
| C 5/4 + DTP                          |       7 |       99.9 | 65 / 40 / 149 / 786          | 6.3 / 22.8         |         65 |                  191 |                  18 |             35.8 |               51.4 |            0.10 |              6.9 |
| C 5/4 + DTP                          |       8 |       99.7 | 68 / 47 / 146 / 543          | 7.5 / 22.7         |         61 |                  226 |                  16 |             37.7 |               55.9 |            0.11 |              7.2 |
| D 5/4 + DTP + 20s                    |       2 |      100.0 | 13 / 11 / 20 / 45            | 1.8 / 3.4          |        100 |                   42 |                  52 |              8.5 |                5.6 |            0.87 |              0.7 |
| D 5/4 + DTP + 20s                    |       3 |      100.0 | 24 / 20 / 42 / 126           | 3.3 / 6.6          |         98 |                   64 |                  37 |             14.6 |               13.7 |            1.41 |              1.9 |
| D 5/4 + DTP + 20s                    |       4 |      100.0 | 41 / 31 / 80 / 313           | 4.9 / 12.1         |         84 |                   92 |                  26 |             23.6 |               26.7 |            2.25 |              3.7 |
| D 5/4 + DTP + 20s                    |       5 |      100.0 | 52 / 31 / 112 / 1454         | 4.9 / 17.2         |         78 |                  117 |                  24 |             27.9 |               38.0 |            2.59 |              5.1 |
| D 5/4 + DTP + 20s                    |       6 |       99.9 | 67 / 35 / 150 / 1227         | 5.4 / 22.2         |         69 |                  149 |                  19 |             35.1 |               51.0 |            3.38 |              6.6 |
| D 5/4 + DTP + 20s                    |       7 |       99.8 | 75 / 47 / 173 / 829          | 7.3 / 26.3         |         61 |                  181 |                  16 |             39.3 |               59.5 |            3.68 |              7.5 |
| D 5/4 + DTP + 20s                    |       8 |       99.5 | 80 / 55 / 177 / 663          | 8.4 / 27.5         |         56 |                  221 |                  16 |             41.8 |               64.7 |            4.15 |              8.1 |
| E 5/4 + DTP + 20s + Alarm next-only  |       2 |      100.0 | 13 / 11 / 20 / 45            | 1.8 / 3.4          |        100 |                   42 |                  52 |              7.9 |                5.7 |            0.88 |              0.7 |
| E 5/4 + DTP + 20s + Alarm next-only  |       3 |      100.0 | 23 / 19 / 39 / 101           | 3.1 / 6.1          |         99 |                   64 |                  36 |             12.5 |               12.0 |            1.37 |              1.8 |
| E 5/4 + DTP + 20s + Alarm next-only  |       4 |      100.0 | 34 / 28 / 62 / 249           | 4.3 / 9.4          |         92 |                   91 |                  27 |             17.6 |               19.4 |            1.89 |              3.0 |
| E 5/4 + DTP + 20s + Alarm next-only  |       5 |      100.0 | 36 / 25 / 71 / 309           | 3.9 / 10.8         |         89 |                  113 |                  24 |             16.9 |               21.5 |            1.84 |              3.4 |
| E 5/4 + DTP + 20s + Alarm next-only  |       6 |      100.0 | 44 / 30 / 90 / 601           | 4.6 / 13.8         |         82 |                  139 |                  19 |             20.1 |               27.3 |            2.23 |              4.4 |
| E 5/4 + DTP + 20s + Alarm next-only  |       7 |      100.0 | 50 / 36 / 107 / 461          | 5.5 / 16.0         |         76 |                  166 |                  17 |             22.6 |               31.4 |            2.42 |              5.2 |
| E 5/4 + DTP + 20s + Alarm next-only  |       8 |      100.0 | 54 / 38 / 111 / 583          | 5.8 / 16.6         |         72 |                  195 |                  16 |             24.0 |               33.8 |            2.68 |              5.7 |
| X1 5/4 + 20s (no DTP)                |       2 |      100.0 | 13 / 11 / 20 / 50            | 1.8 / 3.4          |        100 |                   43 |                  50 |              8.3 |                5.4 |            0.88 |              0.0 |
| X1 5/4 + 20s (no DTP)                |       3 |      100.0 | 24 / 20 / 42 / 110           | 3.1 / 6.2          |         98 |                   63 |                  37 |             13.6 |               12.4 |            1.43 |              0.0 |
| X1 5/4 + 20s (no DTP)                |       4 |      100.0 | 39 / 31 / 76 / 206           | 4.8 / 11.3         |         85 |                   91 |                  26 |             21.0 |               23.4 |            2.26 |              0.0 |
| X1 5/4 + 20s (no DTP)                |       5 |      100.0 | 48 / 31 / 102 / 937          | 4.6 / 15.0         |         80 |                  113 |                  25 |             23.4 |               32.0 |            2.57 |              0.0 |
| X1 5/4 + 20s (no DTP)                |       6 |       99.8 | 74 / 38 / 172 / 2908         | 5.8 / 24.4         |         68 |                  147 |                  18 |             33.6 |               51.5 |            3.63 |              0.0 |
| X1 5/4 + 20s (no DTP)                |       7 |       99.9 | 84 / 48 / 193 / 1534         | 7.2 / 28.9         |         60 |                  176 |                  16 |             38.6 |               61.1 |            4.22 |              0.0 |
| X1 5/4 + 20s (no DTP)                |       8 |       99.6 | 96 / 59 / 220 / 2680         | 8.8 / 33.1         |         53 |                  211 |                  16 |             42.8 |               70.5 |            4.86 |              0.0 |
| X2 4/3 + DTP + 20s                   |       2 |      100.0 | 10 / 8 / 16 / 47             | 1.4 / 2.7          |        100 |                   41 |                  56 |              6.5 |                4.4 |            0.65 |              0.6 |
| X2 4/3 + DTP + 20s                   |       3 |      100.0 | 18 / 15 / 35 / 140           | 2.3 / 5.3          |         99 |                   62 |                  37 |             10.9 |               10.6 |            1.04 |              1.5 |
| X2 4/3 + DTP + 20s                   |       4 |      100.0 | 31 / 21 / 61 / 398           | 3.3 / 9.5          |         91 |                   88 |                  28 |             17.3 |               20.5 |            1.72 |              2.7 |
| X2 4/3 + DTP + 20s                   |       5 |      100.0 | 31 / 16 / 65 / 617           | 2.5 / 10.0         |         90 |                  105 |                  26 |             15.6 |               22.2 |            1.50 |              2.9 |
| X2 4/3 + DTP + 20s                   |       6 |       99.9 | 41 / 20 / 97 / 614           | 3.0 / 14.8         |         84 |                  134 |                  21 |             20.8 |               31.9 |            2.08 |              4.2 |
| X2 4/3 + DTP + 20s                   |       7 |       99.6 | 50 / 22 / 128 / 844          | 3.5 / 19.3         |         78 |                  169 |                  20 |             25.0 |               40.0 |            2.41 |              5.3 |
| X2 4/3 + DTP + 20s                   |       8 |       99.6 | 53 / 25 / 132 / 665          | 3.8 / 20.2         |         76 |                  197 |                  18 |             26.3 |               43.9 |            2.63 |              5.4 |
| X3 4/3 + DTP + 20s + Alarm next-only |       2 |      100.0 | 10 / 9 / 16 / 47             | 1.4 / 2.7          |        100 |                   41 |                  56 |              6.0 |                4.5 |            0.66 |              0.5 |
| X3 4/3 + DTP + 20s + Alarm next-only |       3 |      100.0 | 17 / 14 / 31 / 99            | 2.2 / 4.8          |         99 |                   61 |                  35 |              9.3 |                9.3 |            1.01 |              1.5 |
| X3 4/3 + DTP + 20s + Alarm next-only |       4 |      100.0 | 26 / 20 / 49 / 192           | 3.1 / 7.7          |         95 |                   85 |                  28 |             12.9 |               15.1 |            1.42 |              2.4 |
| X3 4/3 + DTP + 20s + Alarm next-only |       5 |      100.0 | 23 / 15 / 47 / 286           | 2.4 / 7.1          |         95 |                  100 |                  24 |             10.2 |               13.9 |            1.09 |              2.2 |
| X3 4/3 + DTP + 20s + Alarm next-only |       6 |      100.0 | 28 / 18 / 60 / 425           | 2.8 / 8.6          |         92 |                  123 |                  21 |             12.3 |               18.1 |            1.34 |              2.9 |
| X3 4/3 + DTP + 20s + Alarm next-only |       7 |      100.0 | 32 / 20 / 68 / 429           | 3.0 / 10.0         |         90 |                  150 |                  20 |             13.3 |               20.2 |            1.48 |              3.2 |
| X3 4/3 + DTP + 20s + Alarm next-only |       8 |      100.0 | 34 / 22 / 76 / 374           | 3.3 / 11.6         |         88 |                  174 |                  18 |             14.1 |               21.9 |            1.61 |              3.5 |

"Longest wait p90" = 90th percentile, per game, of the longest time one player waited between two of their own turns (estimate).

### Win rate by player profile (%; fair = 100 / players)

| Config                               | Players | Careful | Casual | Impulsive | Slow |
| ------------------------------------ | ------: | ------: | -----: | --------: | ---: |
| A current                            |       2 |    58.9 |   40.9 |      42.6 | 57.6 |
| A current                            |       4 |    36.5 |   16.8 |      12.4 | 34.5 |
| A current                            |       8 |    19.2 |    6.9 |       5.7 | 18.2 |
| B hand 5/4                           |       2 |    57.7 |   43.0 |      44.2 | 55.2 |
| B hand 5/4                           |       4 |    34.1 |   18.5 |      16.2 | 31.2 |
| B hand 5/4                           |       8 |    17.4 |    7.1 |       6.9 | 18.5 |
| C 5/4 + DTP                          |       2 |    57.3 |   42.6 |      47.7 | 52.5 |
| C 5/4 + DTP                          |       4 |    31.7 |   18.2 |      17.0 | 33.0 |
| C 5/4 + DTP                          |       8 |    17.4 |    8.3 |       7.2 | 17.1 |
| D 5/4 + DTP + 20s                    |       2 |    58.2 |   49.4 |      56.2 | 36.2 |
| D 5/4 + DTP + 20s                    |       4 |    35.3 |   23.9 |      22.8 | 18.0 |
| D 5/4 + DTP + 20s                    |       8 |    19.3 |   10.2 |      10.0 | 10.5 |
| E 5/4 + DTP + 20s + Alarm next-only  |       2 |    58.8 |   49.4 |      55.5 | 36.3 |
| E 5/4 + DTP + 20s + Alarm next-only  |       4 |    35.3 |   22.6 |      21.6 | 20.5 |
| E 5/4 + DTP + 20s + Alarm next-only  |       8 |    18.1 |   11.1 |      11.0 |  9.8 |
| X1 5/4 + 20s (no DTP)                |       2 |    58.4 |   49.2 |      51.9 | 40.5 |
| X1 5/4 + 20s (no DTP)                |       4 |    36.7 |   23.6 |      20.3 | 19.4 |
| X1 5/4 + 20s (no DTP)                |       8 |    20.2 |    9.9 |       9.1 | 10.8 |
| X2 4/3 + DTP + 20s                   |       2 |    54.3 |   51.9 |      57.0 | 36.7 |
| X2 4/3 + DTP + 20s                   |       4 |    33.5 |   23.9 |      24.3 | 18.5 |
| X2 4/3 + DTP + 20s                   |       8 |    17.8 |   11.2 |      11.7 |  9.3 |
| X3 4/3 + DTP + 20s + Alarm next-only |       2 |    54.6 |   51.9 |      56.5 | 36.9 |
| X3 4/3 + DTP + 20s + Alarm next-only |       4 |    32.9 |   24.5 |      23.8 | 18.9 |
| X3 4/3 + DTP + 20s + Alarm next-only |       8 |    16.5 |   11.1 |      12.6 |  9.8 |

### Ability ablation (base = D; Δ = with the ability − ability never used; positive = the ability makes games longer)

| Card       | Δ turns 4p | Δ est. min 4p | Δ turns 8p | Δ est. min 8p |
| ---------- | ---------: | ------------: | ---------: | ------------: |
| หนังยาง     |       +3.6 |         +0.41 |       +2.5 |         +0.41 |
| กาวน้ำ      |       +1.4 |         +0.14 |       +1.2 |         +0.35 |
| ยางลบ      |       +0.3 |         +0.16 |       -0.4 |         +0.27 |
| กรรไกร     |       -2.8 |         -0.21 |      -13.2 |         -0.89 |
| กล่องกระดาษ |       -2.3 |         -0.01 |       -7.5 |         -0.46 |
| นาฬิกาปลุก   |      +10.3 |         +1.09 |      +27.1 |         +2.84 |
| แม่เหล็ก     |       -0.8 |         +0.18 |       -3.6 |         -0.63 |
| แว่นขยาย    |       -0.2 |         +0.07 |       +1.2 |         +0.32 |
| ไม้บรรทัด    |       +1.2 |         +0.28 |       +4.3 |         +0.67 |
| เทปกาว     |      -28.7 |         -1.34 |      -33.4 |         -4.07 |
| ถังขยะ      |       -1.1 |         +0.13 |       -4.1 |         -0.28 |
| ไฟฉาย      |       +3.3 |         +0.48 |       +9.7 |         +1.32 |
| กุญแจ       |       -1.5 |         +0.06 |       +0.7 |         +0.12 |
| พัดลม       |       +5.2 |         +0.61 |       +6.5 |         +0.55 |
| นาฬิกาทราย  |       -0.7 |         -0.01 |       -4.0 |         -0.33 |
| ร่ม         |       -0.1 |         +0.03 |       -0.2 |         -0.02 |

## 4. Reading the results

1. **Current rules (A):** almost every game finishes, but the tail is long. At 6–8 players the p90 is ~150–200 turns (est. 23–30 min), the longest seat-wait p90 is 3–4 min, and 0.3–0.5 % of 7–8 player games stall.
2. **Smaller starting hand (B):** cuts turns by ~25–35 % at every size — the most reliable single change.
3. **Draw Then Play (C):** alone barely moves the median, because more plays also mean more ability draws. With the timer it shortens the 6–8 player tail (D vs X1 at 8 players: p90 177 vs 220 turns, 99.5 vs 99.6 % finished, fewer timeouts). It also gives the drawing player a decision.
4. **20 s timer (D):** shortens each turn but adds 1–4 timeouts per game. Timeouts are auto-draws, so slower players lose more (slow profile win rate at 2 players: 58 % → 36 %). It needs clear warnings and AFK handling.
5. **Alarm Clock** is by far the biggest game-extender (+27 turns / +2.8 min at 8 players), because "everyone else draws" grows with the player count. **E** (Alarm next-only) cuts the 8-player mean from 80 to 54 turns and the p90 from 177 to 111, and finishes 100 % of games.
6. **4 / 3 cards (X2 / X3):** faster still, but very short at 2–5 players (median ≈ 1.4–3 min), with a bigger first-player edge (2 players: 56 %) and fewer combos. Kept as a fallback.

## 5. Verification on the shipped engine (ruleset "8", task 12.12)

Same harness and time model, 2,000 games per row, run on engine 2.0.0 (the configs above were run on the ruleset 7 engine at commit 07ebd61). "R8 shipped" reproduces configuration E (8 players: mean 53 vs 54 turns, est. median 5.8 vs 5.8 min).

| Config         | Players | Finished % | Turns mean / p50 / p90 / max | Est. min p50 / p90 | ≤ 10 min % | Longest wait p90 (s) | First player wins % | Timeouts / game | Drawn-card plays / game |
| -------------- | ------: | ---------: | ---------------------------- | ------------------ | ---------: | -------------------: | ------------------: | --------------: | ----------------------: |
| R8 shipped     |       2 |      100.0 | 13 / 11 / 20 / 55            | 1.8 / 3.4          |        100 |                   44 |                  55 |            0.85 |                     0.7 |
| R8 shipped     |       3 |      100.0 | 22 / 19 / 39 / 79            | 3.0 / 5.9          |         99 |                   64 |                  36 |            1.31 |                     1.8 |
| R8 shipped     |       4 |      100.0 | 34 / 28 / 66 / 215           | 4.3 / 9.8          |         91 |                   90 |                  27 |            1.88 |                     3.1 |
| R8 shipped     |       5 |      100.0 | 35 / 25 / 72 / 324           | 3.9 / 10.4         |         89 |                  111 |                  24 |            1.81 |                     3.5 |
| R8 shipped     |       6 |      100.0 | 43 / 30 / 87 / 663           | 4.6 / 13.0         |         83 |                  140 |                  21 |            2.19 |                     4.3 |
| R8 shipped     |       7 |      100.0 | 51 / 35 / 109 / 466          | 5.3 / 16.2         |         76 |                  164 |                  16 |            2.52 |                     5.5 |
| R8 shipped     |       8 |      100.0 | 53 / 39 / 107 / 446          | 5.8 / 16.0         |         74 |                  197 |                  15 |            2.58 |                     5.8 |
| R8 without DTP |       2 |      100.0 | 13 / 11 / 20 / 57            | 1.8 / 3.4          |        100 |                   44 |                  54 |            0.86 |                     0.0 |
| R8 without DTP |       3 |      100.0 | 22 / 19 / 37 / 85            | 2.9 / 5.7          |         99 |                   62 |                  35 |            1.31 |                     0.0 |
| R8 without DTP |       4 |      100.0 | 34 / 28 / 62 / 160           | 4.2 / 9.2          |         92 |                   87 |                  26 |            1.94 |                     0.0 |
| R8 without DTP |       5 |      100.0 | 34 / 25 / 68 / 353           | 3.8 / 9.8          |         91 |                  108 |                  22 |            1.84 |                     0.0 |
| R8 without DTP |       6 |      100.0 | 44 / 31 / 90 / 506           | 4.7 / 13.0         |         83 |                  134 |                  18 |            2.28 |                     0.0 |
| R8 without DTP |       7 |      100.0 | 54 / 37 / 114 / 471          | 5.4 / 16.1         |         76 |                  162 |                  17 |            2.73 |                     0.0 |
| R8 without DTP |       8 |      100.0 | 59 / 40 / 126 / 564          | 5.9 / 18.1         |         71 |                  187 |                  15 |            2.90 |                     0.0 |
| R8 4/3 cards   |       2 |      100.0 | 10 / 9 / 16 / 51             | 1.4 / 2.8          |        100 |                   42 |                  55 |            0.70 |                     0.6 |
| R8 4/3 cards   |       3 |      100.0 | 18 / 14 / 32 / 96            | 2.2 / 4.9          |        100 |                   60 |                  37 |            0.96 |                     1.5 |
| R8 4/3 cards   |       4 |      100.0 | 26 / 20 / 49 / 188           | 3.1 / 7.5          |         96 |                   86 |                  28 |            1.40 |                     2.4 |
| R8 4/3 cards   |       5 |      100.0 | 23 / 15 / 49 / 334           | 2.3 / 7.1          |         95 |                   99 |                  26 |            1.11 |                     2.3 |
| R8 4/3 cards   |       6 |      100.0 | 27 / 17 / 59 / 327           | 2.6 / 8.6          |         92 |                  125 |                  22 |            1.31 |                     2.8 |
| R8 4/3 cards   |       7 |      100.0 | 31 / 20 / 67 / 367           | 3.0 / 9.9          |         90 |                  147 |                  19 |            1.44 |                     3.2 |
| R8 4/3 cards   |       8 |      100.0 | 35 / 22 / 77 / 314           | 3.3 / 11.3         |         88 |                  171 |                  18 |            1.62 |                     3.8 |
| R8 45 s timer  |       2 |      100.0 | 12 / 11 / 17 / 44            | 1.8 / 3.1          |        100 |                   49 |                  57 |            0.03 |                     0.7 |
| R8 45 s timer  |       3 |      100.0 | 20 / 17 / 34 / 95            | 2.9 / 5.3          |        100 |                   73 |                  36 |            0.04 |                     1.7 |
| R8 45 s timer  |       4 |      100.0 | 30 / 25 / 53 / 269           | 4.0 / 8.1          |         96 |                   97 |                  27 |            0.05 |                     2.8 |
| R8 45 s timer  |       5 |      100.0 | 31 / 23 / 61 / 300           | 3.7 / 9.5          |         91 |                  118 |                  23 |            0.04 |                     3.2 |
| R8 45 s timer  |       6 |      100.0 | 37 / 26 / 74 / 355           | 4.2 / 11.2         |         88 |                  142 |                  22 |            0.05 |                     3.8 |
| R8 45 s timer  |       7 |      100.0 | 43 / 30 / 88 / 451           | 4.9 / 13.0         |         81 |                  173 |                  17 |            0.07 |                     4.7 |
| R8 45 s timer  |       8 |      100.0 | 47 / 33 / 95 / 371           | 5.2 / 14.5         |         79 |                  203 |                  15 |            0.07 |                     5.2 |

Note: in this model a 45 s timer gives slightly shorter rounds than 20 s, because 20 s causes more timeouts (auto-draws). The 20 s timer (owner decision) mainly limits waiting for slow / away players; playtest data will decide whether to tune it.

## 6. Quality audit metrics (ruleset "8", task 12.13)

2,000 rounds per row on the shipped engine, same profiles and time model (minutes are model estimates). Win index = win rate ÷ fair rate.

### A. Baseline (ruleset "8")

| Players | Mean / median turns | Turns per player | Est. min median / p90 (model) | ≤ 10 min | Cards played / round | Forced draws / round | Skips / round | Most hits on one player (p90) | Losers with ≥ 2× start hand | Win % by turn position (1st → last)   |
| ------: | ------------------- | ---------------: | ----------------------------- | -------: | -------------------: | -------------------: | ------------: | ----------------------------: | --------------------------: | ------------------------------------- |
|       2 | 13 / 11             |              6.4 | 1.8 / 3.4                     |    100 % |                 11.7 |                  2.0 |           0.6 |                             4 |                       0.3 % | 55 / 45                               |
|       3 | 22 / 19             |              7.4 | 3.0 / 5.9                     |     99 % |                 18.8 |                  3.3 |           1.1 |                             5 |                       0.8 % | 36 / 33 / 31                          |
|       4 | 34 / 28             |              8.6 | 4.3 / 9.8                     |     91 % |                 27.4 |                  4.9 |           1.8 |                             5 |                       0.8 % | 27 / 24 / 27 / 22                     |
|       5 | 35 / 25             |              7.1 | 3.9 / 10.4                    |     89 % |                 26.0 |                  4.7 |           1.8 |                             5 |                       2.9 % | 24 / 20 / 19 / 19 / 18                |
|       6 | 43 / 30             |              7.1 | 4.6 / 13.0                    |     83 % |                 30.7 |                  5.4 |           2.2 |                             5 |                       3.8 % | 21 / 18 / 17 / 14 / 15 / 15           |
|       7 | 51 / 35             |              7.3 | 5.3 / 16.2                    |     76 % |                 35.9 |                  6.3 |           2.8 |                             5 |                       4.2 % | 16 / 15 / 15 / 14 / 14 / 13 / 13      |
|       8 | 53 / 39             |              6.6 | 5.8 / 16.0                    |     74 % |                 37.2 |                  6.3 |           3.0 |                             5 |                       3.6 % | 15 / 12 / 13 / 11 / 12 / 13 / 12 / 12 |

### B. Per card

See `AumMon_Card_Balance_Review.md` §1.

### C. Balance proposals (emulated in the harness; not approved)

| Config                                                 | Players | Mean turns | Est. min median / p90 | ≤ 10 min | Win index range (min–max) | กุญแจ |   ร่ม | ถังขยะ | เทปกาว | Losers ≥ 2× start |
| ------------------------------------------------------ | ------: | ---------: | --------------------- | -------: | ------------------------- | ---: | ---: | ----: | -----: | ----------------: |
| R8 shipped                                             |       2 |         13 | 1.8 / 3.4             |    100 % | 0.84–1.15                 | 1.13 | 1.08 |  0.87 |   1.10 |             0.3 % |
| R8 shipped                                             |       4 |         34 | 4.3 / 9.8             |     91 % | 0.76–1.37                 | 1.22 | 1.37 |  0.76 |   1.29 |             0.8 % |
| R8 shipped                                             |       6 |         43 | 4.6 / 13.0            |     83 % | 0.70–1.48                 | 1.35 | 1.48 |  0.75 |   1.35 |             3.8 % |
| R8 shipped                                             |       8 |         53 | 5.8 / 16.0            |     74 % | 0.63–1.58                 | 1.29 | 1.58 |  0.63 |   1.45 |             3.6 % |
| R8 + Key 6 pts (proposal)                              |       2 |         12 | 1.8 / 3.4             |    100 % | 0.84–1.16                 | 1.14 | 1.08 |  0.87 |   1.10 |             0.4 % |
| R8 + Key 6 pts (proposal)                              |       4 |         33 | 4.2 / 9.4             |     92 % | 0.75–1.35                 | 1.12 | 1.30 |  0.75 |   1.35 |             0.8 % |
| R8 + Key 6 pts (proposal)                              |       6 |         39 | 4.2 / 12.6            |     85 % | 0.64–1.52                 | 1.18 | 1.52 |  0.71 |   1.45 |             2.7 % |
| R8 + Key 6 pts (proposal)                              |       8 |         45 | 5.2 / 13.4            |     80 % | 0.65–1.60                 | 1.18 | 1.45 |  0.65 |   1.60 |             2.2 % |
| R8 + Umbrella 7 pts (proposal)                         |       2 |         12 | 1.7 / 3.4             |    100 % | 0.85–1.21                 | 1.21 | 1.07 |  0.89 |   1.07 |             0.3 % |
| R8 + Umbrella 7 pts (proposal)                         |       4 |         33 | 4.2 / 9.5             |     92 % | 0.76–1.32                 | 1.29 | 1.28 |  0.76 |   1.32 |             0.7 % |
| R8 + Umbrella 7 pts (proposal)                         |       6 |         42 | 4.5 / 13.0            |     83 % | 0.68–1.50                 | 1.50 | 1.34 |  0.70 |   1.40 |             3.2 % |
| R8 + Umbrella 7 pts (proposal)                         |       8 |         49 | 5.5 / 14.7            |     77 % | 0.64–1.48                 | 1.47 | 1.43 |  0.64 |   1.48 |             2.4 % |
| R8 + Trash no redraw (proposal)                        |       2 |         12 | 1.7 / 3.3             |    100 % | 0.84–1.13                 | 1.13 | 1.07 |  0.92 |   1.11 |             0.2 % |
| R8 + Trash no redraw (proposal)                        |       4 |         32 | 4.1 / 9.0             |     93 % | 0.78–1.33                 | 1.24 | 1.33 |  0.87 |   1.31 |             0.9 % |
| R8 + Trash no redraw (proposal)                        |       6 |         39 | 4.2 / 11.6            |     86 % | 0.70–1.51                 | 1.34 | 1.51 |  0.87 |   1.31 |             3.4 % |
| R8 + Trash no redraw (proposal)                        |       8 |         47 | 5.3 / 14.1            |     78 % | 0.65–1.54                 | 1.33 | 1.54 |  0.85 |   1.41 |             3.1 % |
| R8 + balance pack (Key 6, Umbrella 7, Trash no redraw) |       2 |         12 | 1.7 / 3.2             |    100 % | 0.85–1.15                 | 1.12 | 1.07 |  0.93 |   1.12 |             0.2 % |
| R8 + balance pack (Key 6, Umbrella 7, Trash no redraw) |       4 |         31 | 3.9 / 8.6             |     94 % | 0.75–1.38                 | 1.11 | 1.33 |  0.87 |   1.38 |             0.7 % |
| R8 + balance pack (Key 6, Umbrella 7, Trash no redraw) |       6 |         36 | 3.9 / 11.5            |     87 % | 0.65–1.54                 | 1.13 | 1.54 |  0.80 |   1.41 |             2.3 % |
| R8 + balance pack (Key 6, Umbrella 7, Trash no redraw) |       8 |         41 | 4.8 / 12.7            |     83 % | 0.67–1.56                 | 1.18 | 1.44 |  0.85 |   1.56 |             2.1 % |

Emulation: points changes patch the card data for the run only; "Trash no redraw" returns the redrawn card to the top of the draw pile. Reproduce one group with `AUMMON_SIM_ONLY="(proposal)"` or `AUMMON_SIM_ONLY="balance pack"`.

## 7. Ruleset "9" and Q2 proposals (task 12.14)

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

"R9 shipped" reproduces the simulated balance pack (8 players: mean 41 turns). B4B / B6B: see `AumMon_Game_Design_Upgrade.md` §4.

## 8. Ruleset "10" (task 12.17)

| Config                                              | Players | Mean turns | Est. min median / p90 | ≤ 10 min | Win index range | แว่นขยาย | กล่องกระดาษ |
| --------------------------------------------------- | ------: | ---------: | --------------------- | -------: | --------------- | ------: | ---------: |
| R9 shipped                                          |       2 |         12 | 1.7 / 3.2             |    100 % | 0.85–1.15       |    0.85 |       0.85 |
| R9 shipped                                          |       4 |         31 | 3.9 / 8.6             |     94 % | 0.75–1.38       |    0.75 |       0.85 |
| R9 shipped                                          |       6 |         36 | 3.9 / 11.6            |     87 % | 0.65–1.53       |    0.68 |       0.77 |
| R9 shipped                                          |       8 |         41 | 4.8 / 12.6            |     84 % | 0.67–1.57       |    0.71 |       0.82 |
| R9 + Magnifier peek & play 1 more (proposal B4B)    |       2 |         11 | 1.6 / 2.9             |    100 % | 0.86–1.13       |    0.95 |       0.86 |
| R9 + Magnifier peek & play 1 more (proposal B4B)    |       4 |         29 | 3.6 / 7.9             |     95 % | 0.79–1.35       |    0.89 |       0.87 |
| R9 + Magnifier peek & play 1 more (proposal B4B)    |       6 |         34 | 3.8 / 10.4            |     89 % | 0.71–1.55       |    0.85 |       0.81 |
| R9 + Magnifier peek & play 1 more (proposal B4B)    |       8 |         39 | 4.6 / 11.9            |     86 % | 0.63–1.55       |    0.88 |       0.84 |
| R9 + Box put 1 card of 1–3 points (proposal B6C)    |       2 |         11 | 1.6 / 2.9             |    100 % | 0.84–1.15       |    0.84 |       0.97 |
| R9 + Box put 1 card of 1–3 points (proposal B6C)    |       4 |         28 | 3.6 / 7.5             |     96 % | 0.76–1.35       |    0.76 |       1.05 |
| R9 + Box put 1 card of 1–3 points (proposal B6C)    |       6 |         33 | 3.7 / 10.2            |     90 % | 0.67–1.54       |    0.67 |       1.01 |
| R9 + Box put 1 card of 1–3 points (proposal B6C)    |       8 |         38 | 4.5 / 11.0            |     87 % | 0.64–1.63       |    0.64 |       1.09 |
| R9 + Magnifier B4B + Box B6C (candidate ruleset 10) |       2 |         11 | 1.5 / 2.8             |    100 % | 0.86–1.16       |    0.96 |       0.94 |
| R9 + Magnifier B4B + Box B6C (candidate ruleset 10) |       4 |         26 | 3.4 / 7.2             |     97 % | 0.77–1.35       |    0.91 |       1.05 |
| R9 + Magnifier B4B + Box B6C (candidate ruleset 10) |       6 |         31 | 3.5 / 9.0             |     93 % | 0.67–1.60       |    0.89 |       1.00 |
| R9 + Magnifier B4B + Box B6C (candidate ruleset 10) |       8 |         36 | 4.3 / 10.7            |     88 % | 0.65–1.64       |    0.82 |       1.11 |
| R10 shipped                                         |       2 |         11 | 1.5 / 2.8             |    100 % | 0.86–1.15       |    0.92 |       0.89 |
| R10 shipped                                         |       4 |         27 | 3.6 / 7.4             |     96 % | 0.78–1.37       |    0.90 |       0.92 |
| R10 shipped                                         |       6 |         33 | 3.6 / 9.9             |     90 % | 0.69–1.58       |    0.91 |       0.88 |
| R10 shipped                                         |       8 |         38 | 4.5 / 11.4            |     86 % | 0.67–1.56       |    0.84 |       0.96 |

"R10 shipped" = the real engine 4.0.0. The R9 + B4B / B6C rows are harness emulations used for the decision. The emulated B6C also kept the old Box effect, which is why its Box index is a little higher than in the shipped ruleset.

## 9. Ruleset "11": starting hand options with a 60 s timer (task 12.18)

1,500 rounds per row (model minutes).

| Starting hand (2–4 / 5–8), 60 s | Players | Mean turns | Est. min median / p90 | 5–10 min | ≤ 10 min | Longest wait p90 | Win index range |
| ------------------------------- | ------: | ---------: | --------------------- | -------: | -------: | ---------------: | --------------- |
| 5/4                             |       2 |         10 | 1.5 / 2.6             |      0 % |    100 % |             46 s | 0.84–1.15       |
| 5/4                             |       4 |         25 | 3.4 / 6.7             |     22 % |     98 % |             94 s | 0.76–1.37       |
| 5/4                             |       6 |         28 | 3.4 / 8.6             |     23 % |     94 % |            142 s | 0.67–1.53       |
| 5/4                             |       8 |         33 | 4.2 / 9.8             |     30 % |     91 % |            195 s | 0.67–1.57       |
| 6/4                             |       2 |         12 | 1.8 / 3.0             |      0 % |    100 % |             50 s | 0.85–1.16       |
| 6/4                             |       4 |         30 | 4.2 / 7.7             |     34 % |     97 % |            102 s | 0.76–1.27       |
| 6/4                             |       6 |         28 | 3.4 / 8.6             |     23 % |     94 % |            142 s | 0.67–1.53       |
| 6/4                             |       8 |         33 | 4.2 / 9.8             |     30 % |     91 % |            195 s | 0.67–1.57       |
| 6/5                             |       2 |         12 | 1.8 / 3.0             |      0 % |    100 % |             50 s | 0.85–1.16       |
| 6/5                             |       4 |         30 | 4.2 / 7.7             |     34 % |     97 % |            102 s | 0.76–1.27       |
| 6/5                             |       6 |         36 | 4.7 / 10.2            |     35 % |     89 % |            154 s | 0.73–1.50       |
| 6/5                             |       8 |         44 | 5.8 / 12.2            |     44 % |     83 % |            210 s | 0.70–1.45       |
| 7/5                             |       2 |         14 | 2.2 / 3.5             |      1 % |    100 % |             51 s | 0.86–1.14       |
| 7/5                             |       4 |         36 | 5.0 / 9.2             |     43 % |     93 % |            105 s | 0.84–1.27       |
| 7/5                             |       6 |         36 | 4.7 / 10.2            |     35 % |     89 % |            154 s | 0.73–1.50       |
| 7/5                             |       8 |         44 | 5.8 / 12.2            |     44 % |     83 % |            210 s | 0.70–1.45       |

Chosen: **7 / 5**. It gives the longest rounds (4 players median 5.0 min, 8 players 5.8 min), the most rounds in the 5–10 min band, a narrower win-index range at 2–4 players, and still 83–93 % of rounds within 10 min.
