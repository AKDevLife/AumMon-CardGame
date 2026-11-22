# AumMon — Tutorial Design (Phase 5)

> Task 12.13 · Status: **design proposal** (UI work, no rule change). Goal: a new player can play alone in under 2 minutes.

## 1. Format

- Interactive **"ฝึกเล่น"** match: you vs 1 friendly bot, with a fixed, scripted deck so each lesson happens on cue.
- Runs on the real engine (local, no server writes) with ruleset "8" rules. Only the deck order is scripted.
- One short sentence per step; the target button or card glows; everything else is dimmed.
- Skip at any time. The tutorial is offered once on the first visit and stays available from home ("วิธีเล่น").

## 2. Steps (about 90 s)

| #   | Lesson             | Script                                            | Hint text (Thai, ≤ 1 line)                  | Done when                        |
| --- | ------------------ | ------------------------------------------------- | ------------------------------------------- | -------------------------------- |
| 1   | Play a card        | top = 3; your hand 1, 5, 7                        | "ลงไพ่ที่แต้ม ≥ 3 — ลองแตะใบที่มีขอบเขียว"          | you play 5 or 7                  |
| 2   | Cannot play → draw | top = 7; hand 2, 3 (no legal card)                | "ไม่มีใบไหนลงได้ — กด 'จั่วไพ่'"                  | you draw                         |
| 3   | Draw Then Play     | the drawn card is 8 (Umbrella shown as a plain 8) | "ใบที่จั่วลงได้! กด 'ลงใบที่จั่ว'"                   | you play it                      |
| 4   | Use an ability     | hand: กุญแจ (7)                                    | "เปิด 'ใช้ความสามารถ' แล้วลง — คนถัดไปจะโดนข้าม" | Key resolves, the bot is skipped |
| 5   | Choose a target    | hand: กาวน้ำ                                       | "เลือกผู้เล่นที่จะติดกาว"                          | target chosen                    |
| 6   | Pile reset         | the bot passes                                    | "ทุกคนผ่าน — กองใหม่! ลงแต้มไหนก็ได้"             | you play any card                |
| 7   | Win                | you hold 1 card                                   | "ลงใบสุดท้าย = ชนะ!"                          | win screen + "เล่นจริงเลย"         |

Not taught upfront (shown when it first happens in a real game): Umbrella reaction, Ruler, Glue on you, Tape pair, the 5-second warning.

## 3. Tooltips and card text

- Tap = preview (exists). Long-press is not needed.
- Every card: **name · points · one-line effect**. The one-line effect follows S2 (`AumMon_Rule_Simplification.md`), e.g.:

| Card   | One-line effect              |
| ------ | ---------------------------- |
| กุญแจ   | "ข้ามคนถัดไป 1 เทิร์น"           |
| เทปกาว | "ลงคู่แต้มเท่ากันเพิ่มได้อีก 2 ใบ"    |
| ร่ม     | "กันการจั่ว/โดนข้าม ใช้นอกเทิร์นได้" |

- First-time banners (shown once per player, saved locally): Umbrella prompt, Ruler on you, Glue on you, pile reset, 5-second warning.

## 4. Measuring it

Tutorial completion rate, time per step, the step where players skip or quit, and the rule-quiz score (Playtest Protocol §4).
