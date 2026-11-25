# AumMon — Flagship Game: BLUFF (v1 — approved)

> Status: **APPROVED by owner 2026-11-25** (B1–B5 = proposed defaults); BLUFF `ruleset_version` `"1"`. Player-count tuning is task 15.4; content schema is 15.9.

## 1. Concept

A situation appears with 4 options. Everyone secretly picks what **they** would do, then guesses what **the room** picked most, and may wager on that guess. Before locking, players may make one short public **claim** ("ฉันเลือก B") — true or a bluff. Reveal shows everything at once; narration teases the room.

Skill = reading friends + bluffing them. No right/wrong answers, so content is cheap to write (~150 items, Q6).

## 2. Match

- 2–8 players, 5 rounds, ~6–9 min. Everyone starts at 0; scores may go negative.
- Round 5 scores ×2 ("final round") so trailing players can come back.
- Each round uses one `approved` content item matching the room's player count, locale and humor level; no item repeats inside a match.

## 3. Round flow (server-timed)

| #   | Phase  | Time | Player action (intent only)                                                             |
| --- | ------ | ---- | --------------------------------------------------------------------------------------- |
| 1   | Read   | 6 s  | — situation + options A–D shown                                                         |
| 2   | Claim  | 15 s | optional: one preset claim "ฉันเลือก X" (X = A–D) or one preset taunt; shown live to room |
| 3   | Lock   | 20 s | **Answer** (A–D), **Prediction** (A–D), **Wager** 0 / 1 / 2                             |
| 4   | Reveal | 8 s  | all answers, predictions, wagers, claims revealed together; narration                   |
| 5   | Score  | 5 s  | round points + scoreboard                                                               |

- Lock ends early when every connected player locked. Answers and predictions stay private (server only) until Reveal.
- Free text chat is out of MVP (moderation); claims and taunts are preset strings only.

## 4. Scoring (per round, before the ×2 final multiplier)

"Top" = the option(s) with the most answers **among the other players** (ties: every tied option counts). In the 2-player variant Top = the opponent's answer.

| Rule       | Points                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Prediction | Prediction ∈ Top → **+2 + wager**; otherwise **− wager**                                                         |
| Crowd (3+) | Your answer is (one of) the most-picked overall → **+1**                                                         |
| Bluff      | Claim ≠ your answer: **+1 per opponent** who predicted your claimed option and was wrong; cap 1 (2–4p), 2 (5–8p) |
| Honest     | Claim = your answer and at least one opponent predicted it → **+1**                                              |

- Wager > 0 pays only when the guess hit rate is above 50 % (EV = 2p + w(2p − 1)), so wagering is a confidence call, not a free bonus.
- **Timeout default:** no answer (not counted in votes, no Crowd), no prediction (0), wager 0, no claim. A disconnected seat gets the same default after the reconnect window (R3).
- **Final tie-break:** most correct predictions → most Bluff + Honest points → shared place (both shown as winners).

## 5. Variants (tuned in 15.4 — see `AumMon_Player_Count_Design.md`; ruleset "2" proposed)

| Players | Differences                                                                                 |
| ------- | ------------------------------------------------------------------------------------------- |
| 2       | Prediction = guess the opponent's answer; no Crowd; Bluff cap 1                             |
| 3–4     | Rules as §4                                                                                 |
| 5–8     | Bluff cap 2; content may use group prompts ("ใครในห้องนี้…" excluded from MVP unless reviewed) |

## 6. Simulation (Monte Carlo, 20,000 matches per size, seeded; original script in PR #120, superseded by the 15.4 `scripts/bluff-sim.mjs`)

Strategies: R random · S reads the crowd · B = S + always bluffs · W = S + always wager 2 · H = S + honest claim. Simulated listeners trust claims a little (naive), which favours bluffers — real players will adapt.

| Players | Tie % | R win | S win | B win | W win | H win |
| ------- | ----: | ----: | ----: | ----: | ----: | ----: |
| 2       |   4.9 |   37% |   48% |   76% |   40% |   61% |
| 3       |   6.8 |   19% |   28% |   43% |   44% |   44% |
| 4       |   7.7 |   12% |   17% |   35% |   34% |   37% |
| 5       |   8.8 |    6% |    9% |   40% |   23% |   31% |
| 8       |  11.3 |    3% |    3% |   29% |   16% |   19% |

Findings:

- Random play loses clearly at 3+ players → skill matters. Honest claims are as strong as bluffs at 3–4 players (Honest bonus added after v0 runs where bluff won 47–51 %).
- **2-player bluff is too strong** against naive listeners (76 %) → 15.4 must tune (e.g. no Bluff points in 2p, or claim optional only from round 2).
- Using a claim always beats silence (S) → intended ("Bluff More"), but 15.4 should check that silent players still have a fair path.
- Ties ≤ 11 % before tie-break; the tie-break resolves most.

## 7. Server / engine notes

- Pure engine module `bluff` in `packages/game-engine` (no RNG beyond the seeded match RNG for item order).
- Commands: `bluff.claim`, `bluff.lock` with idempotency key; server rejects locks after the timer and answers/wagers outside the allowed range.
- Broadcast before Reveal: only who has claimed (claim text) and who has locked — never answers, predictions or wagers.

## 8. Open questions (owner)

| ID    | Question                                                           | Proposed default               |
| ----- | ------------------------------------------------------------------ | ------------------------------ |
| B1 ✅ | Approve the core loop (answer + crowd prediction + wager + claim)? | yes                            |
| B2 ✅ | Wager 0–2 per round, or a match budget of chips?                   | 0–2 per round (simpler)        |
| B3 ✅ | Final round ×2?                                                    | yes                            |
| B4 ✅ | 2-player fix: remove Bluff points or keep and re-tune in 15.4?     | re-tune in 15.4                |
| B5 ✅ | Phase timers 6 / 15 / 20 / 8 / 5 s OK?                             | yes; host may pick "slow" ×1.5 |
