# AumMon — Playtest Protocol (Phase 6)

> Task 12.13 · Status: ready to run once the P1 items from `AumMon_Player_Experience.md` §5 are built. Extends `AumMon_Game_Test_Plan.md` §4.
> **Human scores are the only evidence for Fun, Ease, Comprehension, Appeal and Replayability.**

## 1. Groups

| Group          | Who                                                      | Sessions | Players per session | Rounds per session              |
| -------------- | -------------------------------------------------------- | -------- | ------------------- | ------------------------------- |
| G1 New         | never played AumMon; casual phone gamers                 | ≥ 3      | 3–5                 | 4 (first one with the tutorial) |
| G2 Regular     | played 1–5 times                                         | ≥ 3      | 4–8                 | 5                               |
| G3 Card gamers | play card games (UNO, Exploding Kittens, TCG) every week | ≥ 3      | 4–8                 | 5                               |

At least 12 different people in total; 2, 4, 6 and 8-player tables must each appear at least twice. Online on their own phones (iPhone + Android).

## 2. Session script (about 45 min)

1. 0–5 min: install / sign in, tutorial (G1), no verbal rule explanations from the host.
2. 5–35 min: rounds; the host only observes and notes confusion moments (quote + time).
3. 35–45 min: questionnaire (§3) + 3 open questions:
   - What was the most fun moment?
   - What confused you?
   - Which card felt unfair?

## 3. Questionnaire (1–10; 10 = best)

| Category           | Question (Thai in the form)                 | Green              |
| ------------------ | ------------------------------------------- | ------------------ |
| Fun                | สนุกแค่ไหน                                    | ≥ 8.5              |
| Ease of Play       | เล่นง่ายแค่ไหน (กดอะไรต่อรู้ทันที)                  | ≥ 8.5              |
| Rule Comprehension | quiz: 5 situation questions → score × 2     | ≥ 8.5 (≥ 4.25 / 5) |
| Card Appeal        | การ์ดน่าสนใจ / อยากสะสม                       | ≥ 8.5              |
| Game Balance       | รู้สึกยุติธรรมไหม                                | ≥ 8.5              |
| Mobile UX          | ใช้บนมือถือสะดวกไหม                            | ≥ 8.5              |
| Replayability      | อยากเล่นอีกรอบทันทีไหม                          | ≥ 8.5              |
| Game Duration      | ความยาวรอบพอดีไหม (5 = สั้นไป/ยาวไป, 10 = พอดี) | ≥ 8.5              |

Category score = mean over all players, **plus** the objective checks in §4. A category is Green only if both are Green.

## 4. Objective checks (from telemetry)

| Category      | Measure                                                                                    | Green              |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------ |
| Game Duration | median round 5–10 min at 4–8 players; ≤ 10 % of rounds > 15 min                            | both               |
| Ease / UX     | timeouts per player per round                                                              | ≤ 0.5              |
| Comprehension | tutorial completion; rule-quiz mean                                                        | ≥ 90 %; ≥ 4.25 / 5 |
| Replayability | rematch rate; rounds per session                                                           | ≥ 60 %; ≥ 4        |
| Balance       | no card with win index > 1.35 or < 0.75 over ≥ 200 human rounds (otherwise use simulation) | —                  |
| Fun           | early quits (leave before round end)                                                       | ≤ 5 %              |

## 5. Telemetry (built in task 12.16: `private.round_stats`, admin → "สถิติเล่นทดสอบ")

Per round: player count, duration, turns, timeouts, rematch yes/no, leaver yes/no, ruleset. Per action: decision time and command type. Per card: plays with / without ability, and the winner's opening cards (server-side, aggregated). Stored in a private table; an admin page shows the summary.

## 6. Reporting

Results go into `AumMon_Game_Quality_Report.md` §3 ("Human Playtest Score"), with the date, the number of players and the rounds behind each number.
