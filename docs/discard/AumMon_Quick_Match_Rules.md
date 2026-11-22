# AumMon — Quick Match Rules (ruleset "8")

> Status: **APPROVED by the owner 2026-11-22 (QM1–QM6) and implemented in task 12.12.** Core Rules and the Card Library are updated to ruleset "8". Best-of-3 for 2–3 players is not built (owner choice pending).
> Every section says whether it is **unchanged** from Core Rules or **changed (proposal)**. Evidence: `AumMon_Game_Simulation_Report.md` (configuration E).

## 1. Goal — unchanged

First player to empty their hand wins the round.

## 2. Players & modes — unchanged

2–8 players · Solo vs Bots · Online. Quick Match is the only mode (no separate "Standard" mode).

## 3. Setup — changed (proposal)

1. Deck: 16 Objects × 4 = 64 cards (unchanged).
2. Deal **5 cards each (2–4 players)** or **4 cards each (5–8 players)** (was 7 / 5).
3. Starting card and random first player: unchanged.

## 4. Your turn — changed (proposal)

You have **20 seconds** (was 45 s). Choose one:

**A. Play a card** — unchanged (≥ top card, or any after a reset; Eraser / Glue / Ruler / Tape / Scissors work as now).

**B. Draw Then Play** (replaces "draw & pass"):

1. Draw 1 card.
2. If **that card** can be legally played now, you may play it immediately (and use its ability as normal).
3. Otherwise — or if you do not want to — your turn ends.
4. You may **not** play any other card from your hand instead.
5. Glue / Ruler restrictions apply to the drawn card exactly as to any card. Ruler: if the drawn card is not a 5 (or Eraser), you pass as before (forced pass).
6. Only one card can follow a draw, so no draw/play loop is possible.
7. For pile reset (§5), a Draw Then Play **play** counts as a play (it resets the pass streak); drawing without playing counts as a pass.

## 5. Pile reset — unchanged

If every other player passes in a row after your card, the pile resets and you lead with any card.

## 6. Reactions — Umbrella — changed (timer only)

Same rule; the decision window is **5 seconds** (was 8 s). No answer = Umbrella not used.

## 7. Effect order — unchanged

## 8. Card changes — proposal P1 (separate approval)

**นาฬิกาปลุก (5)** — "สลับทิศทางการเล่น แล้วผู้เล่นคนถัดไป (ตามทิศใหม่) จั่ว 1 ใบ" (was: all other players draw 1). The draw can be blocked with Umbrella. All other 15 cards: unchanged.

## 9. Timers and timeouts — new (proposal)

The **server** owns every clock; the client only displays it.

| Situation                                             | Resolution                                                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Turn starts                                           | Server sets the deadline = now + 20 s (after the previous action's animation allowance of 1 s). The response carries the deadline and the server time; the client corrects its clock offset.      |
| 5 s left                                              | The client shows a red timer and plays a warning sound (display only).                                                                                                                            |
| Timeout while choosing a card / an ability / a target | Nothing has been sent (one command carries card + ability + choice), so the server performs **Draw Then Play without playing**: draw 1, turn ends. Open popups close with "หมดเวลา — จั่วให้อัตโนมัติ". |
| Timeout after drawing (Draw Then Play decision)       | The drawn card stays in hand; turn ends. The decision window is the remaining turn time, at least 5 s.                                                                                            |
| Command arrives near the deadline                     | Accepted if the server **receives** it before the deadline + 0.5 s network grace. Once accepted and locked, it is processed to the end even if the deadline passes during processing.             |
| Command arrives after the grace                       | Rejected (`stale_version` / `not_your_turn`); the client shows the server result.                                                                                                                 |
| Umbrella timeout (5 s)                                | Treated as "not used".                                                                                                                                                                            |
| Disconnect                                            | The clock keeps running; timeouts apply normally. Online: after **2 timeouts in a row**, the seat switches to **auto-play** (server bot) until the player sends any command again.                |
| Rejoin during your turn                               | The view returns the current deadline; you can act if time remains.                                                                                                                               |
| Server lag                                            | Deadlines use server time only; a late server step never shortens a player's 20 s (deadline set when the turn actually starts).                                                                   |
| Client clock wrong                                    | Ignored for results; display uses `deadline − (serverNow − clientNow)`.                                                                                                                           |
| Bots                                                  | Act after a short step (0.7 s) and never wait for the full timer.                                                                                                                                 |

## 10. Quick Match flow — new (UI proposal)

- Start: Solo starts instantly; Online room → "เริ่ม" when everyone is ready.
- End: winner banner immediately; **"เล่นอีกรอบ"** button for the same room/bots (one tap). Online: same players, a new shuffle, the previous winner does not get the first turn (random).
- Optional (owner choice): 2–3 players = best of 3 rounds.

## 11. Fair play — unchanged
