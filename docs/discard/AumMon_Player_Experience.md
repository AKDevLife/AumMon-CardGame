# AumMon — Player Experience (Phases 5 & 7)

> Task 12.13 · Status: **UX audit + proposals** for the live game screen (12.9 redesign, 12.12 Quick Match UI). The UI proposals do not change rules.

## 1. "Do I know at a glance…?" (iPhone)

| Question                  | Today                                    | Gap           | Proposal                                                           |
| ------------------------- | ---------------------------------------- | ------------- | ------------------------------------------------------------------ |
| Whose turn?               | yellow "ตาคุณ!" pill, glowing player chip | —             | keep                                                               |
| Which cards can I play?   | green ring; others dimmed                | —             | keep                                                               |
| Which cannot, and why?    | tap → reason                             | —             | keep                                                               |
| What does this card do?   | text cut off on hand cards               | F7            | S2 short text on the card                                          |
| What next?                | hint line + thumb-zone button            | —             | keep                                                               |
| Time left?                | counter, red at 5 s + sound              | no visual bar | X1: thin timer bar around the active player                        |
| What just happened to me? | banners (skip, draw, timeout)            | —             | keep; add "+1" flying to your hand count on forced draws (X2)      |
| Who is targeting whom?    | history + last-action line               | no arrow      | X3: short arrow from the attacker chip to the target chip (300 ms) |

## 2. Fewer taps

| Flow                           |                                 Taps today | Proposal                                                            | Taps after |
| ------------------------------ | -----------------------------------------: | ------------------------------------------------------------------- | ---------: |
| Play a card without choices    |                          2 (card → "ลงไพ่") | keep (prevents mistakes on small screens)                           |          2 |
| Play with a target             | 3–4 (card → switch → target button → play) | X4: tap the target **chip on the table** while the card is selected |          3 |
| Draw, then play the drawn card |                                          3 | keep                                                                |          3 |
| Rematch                        |                                          1 | keep                                                                |          1 |

## 3. Waiting at 6–8 players (Fun / Duration)

- Bot steps 0.7 s: keep.
- X5: during other players' turns you can still inspect your cards (exists) and see the next 2 turns ("ต่อไป: Bot 2 → คุณ").
- X6: a "your turn in 2" pulse, so players look back at the phone in time.

## 4. Emotional beats

| Moment                         | Today             | Proposal                                                                        |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------- |
| Big play (Tape pair, Alarm)    | banner            | X7: card-specific sound + 0.5 s card zoom                                       |
| Close to winning (1 card left) | —                 | X8: "เหลือ 1 ใบ!" badge on that player (public info, helps tension and fairness) |
| Win                            | confetti, rematch | keep                                                                            |

## 5. Priority

| Priority             | Items                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| P1 (before playtest) | ✅ Tutorial, ✅ S2 short text, ✅ X8 last-card badge, ✅ 4-line rules, ✅ Hourglass hint (12.15); telemetry (12.16) |
| P2                   | X1 timer bar, X4 tap-target on table, X5 / X6 turn preview                                                          |
| P3                   | X2, X3, X7 effects (after card art)                                                                                 |
