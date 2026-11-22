# AumMon — Quick Match Proposal (final recommendation)

> Task 12.11 · Status: **PROPOSAL — owner approval required before any production rule changes.**
> Approved by the owner: Quick Match First, 5–10 min per round, 20 s per turn, mobile first, keep card abilities fun, no separate Standard mode.
> Not yet approved: everything marked **Proposal** below.

## Answers to the brief

| #   | Question                              | Answer                                                                                                                                                                                                                                  |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | What makes the current game too long? | Starting hand 7 / 5; **Alarm Clock** "all others draw" (+27 turns at 8 players); other forced draws; draw-and-pass streaks; 45 s turns. See Duration Analysis §1.                                                                       |
| 2   | Best starting hand for 2–8 players?   | **5 cards (2–4 players), 4 cards (5–8 players)** — the brief's proposal. It cuts 25–35 % of turns and keeps combos possible. 4 / 3 is faster but too short at 2–5 players, with a bigger first-player edge — fallback only.             |
| 3   | Use Draw Then Play?                   | **Yes.** On its own it barely changes the median, but with the 20 s timer it shortens the 6–8 player tail (8 players p90: 177 vs 220 turns), cuts timeouts and gives the drawing player a decision. It must stay "only the drawn card". |
| 4   | Is a 20 s turn timer right?           | **Yes, with safeguards:** 5 s warning, atomic commands, 0.5 s grace, auto-play after 2 timeouts (Online), Umbrella 5 s. Risk: slower / younger players time out more (slow-profile win rate drops); watch in playtest.                  |
| 5   | Which abilities need changes?         | **Alarm Clock (P1)** only. Watch: Flashlight, Fan, Ruler (mild extenders), Key and Tape (strongest). No other change.                                                                                                                   |
| 6   | Best Quick Match ruleset?             | **Configuration E:** 5 / 4 cards + Draw Then Play + 20 s turn + 5 s Umbrella + Alarm next-only + rematch button. Rules: `AumMon_Quick_Match_Rules.md`.                                                                                  |
| 7   | Expected round length?                | Model (no talking / network): median 1.8 min (2p) → 5.8 min (8p); p90 3.4 → 16.6 min. With an assumed +30–60 % real-life overhead: about 2.5–4 min (2–3p), 5–7 min (4–5p), 6–9 min (6–8p). **Estimate only — playtest required.**       |
| 8   | What must be tested before launch?    | `AumMon_Game_Test_Plan.md`: engine rules, timeout cases, multiplayer timers, iPhone UI, and an owner playtest with real timings at 2 / 4 / 6 / 8 players.                                                                               |

## Decisions for the owner

| ID  | Decision                                                      | Recommendation                      |
| --- | ------------------------------------------------------------- | ----------------------------------- |
| QM1 | Starting hand 5 (2–4) / 4 (5–8)                               | Approve                             |
| QM2 | Draw Then Play replaces draw & pass                           | Approve                             |
| QM3 | Turn timer 20 s, Umbrella 5 s, timeout = draw & pass          | Approve                             |
| QM4 | Online: 2 timeouts in a row → auto-play until the player acts | Approve                             |
| QM5 | Alarm Clock → reverse + next player draws 1 (P1)              | Approve                             |
| QM6 | "เล่นอีกรอบ" rematch button; 2–3 players best of 3 (optional)   | Rematch yes; best of 3 owner choice |

## If approved — implementation plan (not started)

1. New `ruleset_version` "8" in the engine (hand sizes, Draw Then Play command, Alarm text) + tests; ruleset 7 stays readable for finished matches.
2. Server: 20 s / 5 s deadlines, grace window, auto-play after 2 timeouts, `serverNow` in responses.
3. UI: Draw Then Play prompt ("ลงใบที่จั่วได้เลย / เก็บไว้"), 5 s warning, rematch button.
4. Docs: Core Rules + Card Library updated to ruleset 8; this proposal archived.
5. Owner playtest (Test Plan §4) → tune hand sizes / timer.

Related: `AumMon_Core_Rules.md` · `AumMon_Card_Library.md` · `AumMon_Card_Balance.md` · `aummon_project_blueprint.md` (architecture) · `docs/AumMon_Master_Handoff.md`.
