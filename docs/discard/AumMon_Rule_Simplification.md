# AumMon — Rule Simplification (Phase 2)

> Task 12.13 · Status: **PROPOSALS — no production rule changed.** Baseline: ruleset "8".

## 1. The whole game in 4 lines (target: understood in 1–2 minutes)

1. **ลงไพ่แต้มเท่ากันหรือสูงกว่าใบบนกอง** — then you may use its power.
2. **ลงไม่ได้หรือไม่อยากลง → จั่ว 1 ใบ** — if that card fits, you may play it right away.
3. **ทุกคนผ่านจนวนกลับมา → กองใหม่**: the last player to play starts again with any card.
4. **หมดมือก่อน = ชนะ.** You have 20 seconds per turn.

Everything else is explained by the card itself when you tap it. This text becomes the first screen of the tutorial and the top of the rules popup (UI change only).

## 2. Audit of rule complexity

| Rule                                 | Needed?           | Simpler wording / change                                         | Type               |
| ------------------------------------ | ----------------- | ---------------------------------------------------------------- | ------------------ |
| ≥ top card                           | core              | keep                                                             | —                  |
| Draw Then Play                       | core (QM2)        | button names say it: "จั่วไพ่" → "ลงใบที่จั่ว" / "เก็บไว้"                | done (UI)          |
| Pile reset                           | core (games end)  | show "🆕 กองใหม่" chip + banner                                   | done (UI)          |
| Eraser wild                          | core              | keep                                                             | —                  |
| Glue "< 4"                           | yes               | say **"ห้ามลงแต้ม 1–3"**                                           | text only          |
| Ruler "exactly 5"                    | yes               | keep; the table chip shows it                                    | —                  |
| Umbrella reaction                    | yes (defence)     | auto-prompt only when you hold it — already the case             | —                  |
| Hourglass "repeat the card under it" | complex           | show the ability to be repeated in the play dialog (B5A)         | UI only            |
| Box two steps                        | complex           | B6B (one extra shed) — needs approval                            | **ability change** |
| Trash "remove + redraw"              | weak, two steps   | B3A (remove only) — needs approval                               | **ability change** |
| Flashlight reveal 5 s                | slows 6–8 players | 3 s (P3 earlier) — needs approval                                | **ability text**   |
| Durations "next turn"                | ambiguous         | one sentence in Core Rules §7: "ผลแบบ 'เทิร์นถัดไป' หมดเมื่อเทิร์นนั้นจบ" | text only          |

## 3. Proposed changes

| ID  | Change                                                                          | Status                   | Approval needed              |
| --- | ------------------------------------------------------------------------------- | ------------------------ | ---------------------------- |
| S1  | 4-line summary first (rules popup + tutorial)                                   | Proposed                 | no (UI)                      |
| S2  | Short card text (≤ about 40 Thai characters) on cards; full text in the preview | Proposed                 | no (text only, same meaning) |
| S3  | Glue text "ห้ามลงแต้ม 1–3"                                                        | Proposed                 | no (same rule)               |
| S4  | Hourglass dialog shows the repeated ability                                     | Proposed                 | no (UI)                      |
| S5  | Trash: remove only (B3A)                                                        | Simulated                | **yes**                      |
| S6  | Box: one extra shed (B6B)                                                       | Proposed (simulate next) | **yes**                      |
| S7  | Flashlight reveal 3 s                                                           | Proposed                 | **yes**                      |

Win condition and turn structure: unchanged.
