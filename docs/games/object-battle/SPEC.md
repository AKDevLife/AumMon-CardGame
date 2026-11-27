# AumMon Object Battle Card — Game Spec

> Card game (internal id `edo_battle`, formerly EDO Battle / Casual Discard Edition), 2–8 players, ruleset `"13"`. Engine: `packages/game-engine/src/discard/` + `edo-battle/`. Rule changes need owner approval and a new ruleset (aummon-domain.md).

## 1. Core rules

> Status: **Approved — ruleset "13" (7 / 5 starting cards, 60 s turns, card changes DC14–DC15; owner 2026-11-22)** · provisional until playtest. Quick Match details (timers, timeouts, rematch): `AumMon_Quick_Match_Rules.md`. Proposed simplifications (not approved): `AumMon_Rule_Simplification.md`. Decisions and reasoning: `AumMon_Rule_Clarification.md`. Cards: `AumMon_Card_Library.md`.
> Rulings marked _(proposed)_ are small clarifications by Claude — the owner may change them at any time.

### 1. Goal

Be the first player to **empty your hand**. In multi-round play the rest keep playing; finishing order = ranking.

### 2. Players & rooms

| Room             | Players | Access                                                       |
| ---------------- | ------- | ------------------------------------------------------------ |
| Normal           | 2–4     | Free                                                         |
| Large (VIP host) | 5–8     | VIP host only (free to test on Dev until VIP is built — DC7) |

Modes: **Solo vs Bots** (1–7 bots), **Online** (join code / link). Pass & Play was removed (DC8).

### 3. Setup

1. Deck: the 16 Objects × 4 copies = **64 cards** (DC2).
2. Shuffle; deal **7 cards each (2–4 players)** or **5 cards each (5–8 players)** (ruleset 11, DC12).
3. The rest is the draw pile; flip the top card to start the discard pile _(proposed: if it is Eraser / Umbrella, flip again so the start is a normal number)_.
4. Random first player; play goes **clockwise**; abilities may reverse it.

### 4. Your turn — choose one

**A. Play a card** whose points are **≥ the top card** (or any card if the pile was reset). Then you **may** use its ability. Some cards change the play rule: Eraser (any card), Tape (extra pair), Scissors (extra card), Ruler (forces an exact value), Glue (forbids low cards).
**B. Draw Then Play** (QM2): draw 1 card. If **that card** can be played legally, you may play it now (ability as normal); otherwise, or if you keep it, your turn ends. You may never play another card instead. You may draw even if you could play. Time: **60 s per turn** (DC12; details in `AumMon_Quick_Match_Rules.md` §9).

### 5. Pile reset (DC1)

If **every other player** draws & passes in a row after your card, the pile **resets**: you start the next turn and may play **any** card.

### 6. Reactions — Umbrella (DC3)

When an effect would make **you** draw or skip your turn, you may immediately play **Umbrella** from your hand (any points, out of turn). The effect is cancelled for you, Umbrella goes on top of the pile, and play continues from where it was. Umbrella can also be played on your own turn as a normal 7.

### 7. Effect order

1. Play the card(s) → 2. resolve its ability (targets chosen by the player who played it) → 3. reactions (Umbrella) → 4. win check → 5. next player in the current direction.
   Durations _(proposed)_: "next turn" effects (Glue, Ruler) apply to that player's next turn and end when it ends; "this round" means until the effect's owner's next turn starts.

### 8. Winning (multi-round ranking optional)

You win the moment your hand is empty after a legal play — including Tape's pair and Scissors' extra card, and when Box / Trash leave you with 0 cards. Drawing can never empty your hand. Multi-round score _(proposed)_: 1st place 0 points, others = sum of points left in hand; lowest total after N rounds wins.

### 9. Empty draw pile

Shuffle the discard pile except the top card into a new draw pile. If there is still nothing to draw, the player passes without drawing.

### 10. Fair play (non-negotiable)

Server decides every result; hands are private (reveals only through Magnifier / Flashlight); no card, ability or draw chance can be bought; VIP and cosmetics never affect gameplay.

## 2. Card library

> Status: approved — ruleset "13" (Glue G2) — earlier: ruleset "12" (owner 2026-11-22: Flashlight, Magnifier, Fan ↔ Alarm; Key art = padlock 🔒) — earlier: ruleset "10" (12.17: Magnifier peek + play 1 more, Box puts 1 card of 1–3 points) — earlier: ruleset "9" (balance pack Q1: Key 6, Umbrella 7, Trash no redraw; Q4 Flashlight 3 s) — earlier: ruleset "8" (owner 2026-11-22: DC3 Umbrella reaction, DC4 Magnet/Hourglass redesign, DC5 Eraser wild, QM5 Alarm next-only). Balance numbers come in Phase 3 (`AumMon_Card_Balance.md`). Abilities are optional after playing (Core Rules §4).

| ID  | Card       | Pts | Ability (Thai text)                                                                 | Target                   | Duration        | Rule notes                                                   | Last card? |
| --- | ---------- | --: | ----------------------------------------------------------------------------------- | ------------------------ | --------------- | ------------------------------------------------------------ | ---------- |
| D01 | หนังยาง     |   2 | **ดีด:** ผู้เล่นคนถัดไปจั่วเพิ่ม 1 ใบ                                                        | next player              | instant         | Umbrella can block                                           | yes        |
| D02 | กาวน้ำ      |   3 | **ติดหนึบ:** ส่งไพ่ 1 ใบจากมือเราไปติดผู้เล่นที่เลือก                                           | chosen player + own hand | instant         | Ruleset 13 (owner chose G2); can win                         | yes        |
| D03 | ยางลบ      |   1 | **ลบเงื่อนไข:** ลงทับไพ่ใบไหนก็ได้ ล้างแต้มและเอฟเฟกต์ของกอง คนถัดไปลงไพ่แต้มไหนก็ได้             | pile                     | until next play | Wild (DC5); also cancels Ruler / Glue                        | yes        |
| D04 | กรรไกร     |   4 | **ตัด:** นำไพ่ใบใต้กรรไกรออกจากเกม แล้วลงไพ่ในมือเพิ่มได้อีก 1 ใบ (ต้องตามกฎแต้มกับไพ่บนกองตอนนั้น) | pile                     | instant         | Extra card's ability may be used                             | yes        |
| D05 | กล่องกระดาษ |   3 | **เก็บของ:** วางไพ่ในมือที่แต้ม 1–3 ลงบนกองเพิ่มได้อีก 1 ใบ (ไม่ใช้พลังของใบนั้น)                  | own hand                 | instant         | Ruleset 10 (12.17); optional; the placed card is the new top | yes        |
| D06 | นาฬิกาปลุก   |   5 | **ปลุก:** ปลุกผู้เล่นที่มีไพ่น้อยที่สุด (ไม่นับเรา) ให้จั่วเพิ่ม 1 ใบ                                   | fewest cards             | instant         | Ruleset 12: took Fan's old ability; Umbrella can block       | yes        |
| D07 | แม่เหล็ก     |   4 | **ดูดติด:** ส่งไพ่ 1 ใบจากมือเราไปติดผู้เล่นที่มีไพ่น้อยที่สุด                                       | fewest cards (not you)   | instant         | Tie: next in turn order; redesigned (DC4)                    | yes        |
| D08 | แว่นขยาย    |   2 | **ส่อง:** แอบดูไพ่ 2 ใบบนสุดของกองจั่ว (เห็นคนเดียว)                                        | draw pile                | instant         | Ruleset 12 (owner)                                           | yes        |
| D09 | ไม้บรรทัด    |   5 | **ตีเส้น:** ผู้เล่นคนถัดไปต้องลงไพ่แต้ม 5 เท่านั้น ไม่งั้นจั่ว 1 ใบและผ่าน                            | next player              | their next turn | Eraser / Umbrella answer it                                  | yes        |
| D10 | เทปกาว     |   6 | **แปะคู่:** หลังลงเทปกาว ลงไพ่ 2 ใบที่แต้มเท่ากันเพิ่มได้ทันที (ไม่ต้องสูงกว่ากอง)                    | own hand                 | instant         | Pair's abilities not used _(proposed)_                       | yes        |
| D11 | ถังขยะ      |   1 | **ทิ้งกาก:** ทิ้งไพ่ในมือ 1 ใบออกจากเกม (ไม่ต้องจั่วคืน)                                       | own hand                 | instant         | Ruleset 9 (Q1): no redraw; can win                           | yes        |
| D12 | ไฟฉาย      |   6 | **ส่องสว่าง:** เลือกผู้เล่น 1 คน ดูไพ่ในมือเขาทั้งหมด (เห็นคนเดียว)                              | chosen player            | instant         | Ruleset 12 (owner): no draw, private                         | yes        |
| D13 | กุญแจ       |   6 | **ล็อก:** ข้ามเทิร์นของผู้เล่นคนถัดไป 1 เทิร์น                                                | next player              | instant         | Umbrella can block                                           | yes        |
| D14 | พัดลม       |   4 | **เป่ากลับ:** สลับทิศทางการเล่น                                                          | direction                | instant         | Ruleset 12: took Alarm's reverse, without the draw           | yes        |
| D15 | นาฬิกาทราย  |   3 | **ย้อนเวลา:** ใช้ความสามารถของไพ่ใบก่อนหน้า (ใบใต้นาฬิกาทราย) ซ้ำอีกครั้ง                      | pile                     | instant         | Redesigned (DC4); no effect if that card has none            | yes        |
| D16 | ร่ม         |   7 | **กางกัน:** ลงสวนนอกเทิร์นได้ เมื่อถูกบังคับจั่วหรือข้ามเทิร์น ยกเลิกผลนั้นกับเรา                      | self                     | instant         | Reaction (DC3); normal 7 on your turn                        | yes        |

Alarm Clock changed in ruleset "8" (QM5) — evidence: `AumMon_Game_Balance_Impact.md`.

Character art: card `Dnn` ↔ character `AM0nn` (same number) in `docs/art-production/AumMon_Character_Library.md`; art status in `AumMon_Asset_Catalog.md`.

Data fields for the engine (brief §4.2): id, name, points, category, ability name / text, trigger (on play / reaction), target, effect, duration, restrictions, canActivate, canBeFinalCard, balanceRating — stored as data so new cards need no engine rewrite.

## 3. Quick Match rules

> Status: **APPROVED by the owner 2026-11-22 (QM1–QM6) and implemented in task 12.12.** Core Rules and the Card Library are updated to ruleset "8". Best-of-3 for 2–3 players is not built (owner choice pending). Ruleset "11" (DC12) changes two values here: starting hands 7 / 5 and a 60 s turn timer. Otherwise still valid in ruleset "9" (task 12.14 only changed card values: Key 6, Umbrella 7, Trash no redraw, Flashlight 3 s).
> Every section says whether it is **unchanged** from Core Rules or **changed (proposal)**. Evidence: `AumMon_Game_Simulation_Report.md` (configuration E).

### 1. Goal — unchanged

First player to empty their hand wins the round.

### 2. Players & modes — unchanged

2–8 players · Solo vs Bots · Online. Quick Match is the only mode (no separate "Standard" mode).

### 3. Setup — changed (proposal)

1. Deck: 16 Objects × 4 = 64 cards (unchanged).
2. Deal **5 cards each (2–4 players)** or **4 cards each (5–8 players)** (was 7 / 5).
3. Starting card and random first player: unchanged.

### 4. Your turn — changed (proposal)

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

### 5. Pile reset — unchanged

If every other player passes in a row after your card, the pile resets and you lead with any card.

### 6. Reactions — Umbrella — changed (timer only)

Same rule; the decision window is **5 seconds** (was 8 s). No answer = Umbrella not used.

### 7. Effect order — unchanged

### 8. Card changes — proposal P1 (separate approval)

**นาฬิกาปลุก (5)** — "สลับทิศทางการเล่น แล้วผู้เล่นคนถัดไป (ตามทิศใหม่) จั่ว 1 ใบ" (was: all other players draw 1). The draw can be blocked with Umbrella. All other 15 cards: unchanged.

### 9. Timers and timeouts — new (proposal)

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

### 10. Quick Match flow

Online update (DC13): after a round everyone returns to the room; non-owners press ready again, and the owner starts when ≥ 2 players are in and all are ready. Solo keeps the one-tap "เล่นอีกรอบ".

#### Original proposal

- Start: Solo starts instantly; Online room → "เริ่ม" when everyone is ready.
- End: winner banner immediately; **"เล่นอีกรอบ"** button for the same room/bots (one tap). Online: same players, a new shuffle, the previous winner does not get the first turn (random).
- Optional (owner choice): 2–3 players = best of 3 rounds.

### 11. Fair play — unchanged

## 4. Tutorial

> Task 12.13 · Status: **built in task 12.15** (`src/features/tutorial/TutorialPage.tsx`, route `/tutorial`, E2E `tests/e2e/tutorial.spec.ts`; UI only, no rule change). First-time banners (§3) and tutorial metrics (§4) come with telemetry (12.16). Goal: a new player can play alone in under 2 minutes.

### 1. Format

- Interactive **"ฝึกเล่น"** match: you vs 1 friendly bot, with a fixed, scripted deck so each lesson happens on cue.
- Runs on the real engine (local, no server writes) with ruleset "8" rules. Only the deck order is scripted.
- One short sentence per step; the target button or card glows; everything else is dimmed.
- Skip at any time. The tutorial is offered once on the first visit and stays available from home ("วิธีเล่น").

### 2. Steps (about 90 s)

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

### 3. Tooltips and card text

- Tap = preview (exists). Long-press is not needed.
- Every card: **name · points · one-line effect**. The one-line effect follows S2 (`AumMon_Rule_Simplification.md`), e.g.:

| Card   | One-line effect              |
| ------ | ---------------------------- |
| กุญแจ   | "ข้ามคนถัดไป 1 เทิร์น"           |
| เทปกาว | "ลงคู่แต้มเท่ากันเพิ่มได้อีก 2 ใบ"    |
| ร่ม     | "กันการจั่ว/โดนข้าม ใช้นอกเทิร์นได้" |

- First-time banners (shown once per player, saved locally): Umbrella prompt, Ruler on you, Glue on you, pile reset, 5-second warning.

### 4. Measuring it

Tutorial completion rate, time per step, the step where players skip or quit, and the rule-quiz score (Playtest Protocol §4).

## 5. Rule clarifications & owner decisions

> Status: **Owner decisions recorded 2026-11-22 (§0)**; remaining small rulings marked PROPOSED.
> Source: owner brief "AumMon — Everyday Objects Battle · Master Game Design & Development Handoff" (2026-11-22).
> Status 2026-11-22: implemented — the 1v1 TCG has been removed (task 12.6); login, sign-up, profile, UI/UX, sounds, admin and other non-rule systems are kept as they are.
> Labels: **[BRIEF]** = owner's text · **[FOUND]** = verified by analysis / simulation · **[PROPOSED]** = my recommendation · **[OPEN]** = owner must decide.

### 0. Owner decisions (2026-11-22) — APPROVED

| ID   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DC1  | **Pile reset:** when every other player draws & passes in a row, the last player who played starts again and may play any card (R1).                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| DC2  | **Deck:** 16 cards × 4 copies = **64 cards** for every room size (R2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| DC3  | **Umbrella is a reaction:** may be played out of turn when a draw / skip effect targets you (any points).                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| DC4  | **Magnet and Hourglass redesigned** as proposed in §3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| DC5  | **Eraser may be played on any card.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| DC6  | The 1v1 TCG is removed once the new game works; the new game keeps **Solo vs Bots (1–7 bots), Pass & Play and Online**.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| DC8  | **Pass & Play removed** (owner 2026-11-22): Online already covers playing with friends. Modes: Solo vs Bots and Online.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| DC9  | **Quick Match, ruleset "8"** (owner approved QM1–QM6 on 2026-11-22): hands 5 / 4, Draw Then Play, 20 s turn + 5 s Umbrella, Online auto-play after 2 timeouts, Alarm Clock next-only, rematch button. `AumMon_Quick_Match_Proposal.md`. Best-of-3 for 2–3 players: **no** (owner 2026-11-23, keep single round + rematch).                                                                                                                                                                                                                                             |
| DC10 | **Ruleset "9" balance pack** (owner approved Q1–Q4 on 2026-11-22): กุญแจ 6 points, ร่ม 7 points, ถังขยะ removes 1 card without redraw, ไฟฉาย reveal 3 s; UI-only items (tutorial, short card text, 4-line rules, last-card badge) and playtest telemetry approved. B4B / B6B simulated — waiting for the owner. `AumMon_Game_Design_Upgrade.md` §4.                                                                                                                                                                                                                       |
| DC11 | **Ruleset "10"** (owner delegated 12.17 to Claude, 2026-11-22: "ตัดสินใจให้เลย ที่คิดว่าดีที่สุด"): แว่นขยาย = peek 2 cards, then you may play 1 more card (points rule); กล่องกระดาษ = you may put 1 card of 1–3 points on the pile (no ability). Chosen from simulation (B4B + the softer B6C; B6B rejected — too strong at 6–8 players). `AumMon_Game_Design_Upgrade.md` §5.                                                                                                                                                                                                     |
| DC12 | **Ruleset "11"** (owner 2026-11-22: "ปรับเวลาต่อรอบ … เป็น 1 นาที" + "เพิ่มจำนวนไพ่บนมือเริ่มต้น … เกมจบเร็วไป"): turn timer **60 s**; starting hand **7 (2–4 players) / 5 (5–8)** — Claude chose the number from simulation (6/4, 6/5, 7/5 compared; 7/5 gives the longest rounds that still finish 83–93 % within 10 min). Umbrella 5 s and the drawn-card minimum of 5 s are unchanged.                                                                                                                                                                                         |
| DC13 | **Online flow (owner playtest 2026-11-22)**: (1) every turn has its own 60 s — fixed a bug where the timer carried over to the next human player; (2) the Flashlight reveal stays open until the player closes it, and shows each card with its ability (tap to enlarge) — no rule change; (3) Online "play again" returns everyone to the room: after a round, all players except the owner are "not ready"; the room shows how many players are inside; the owner can start only with ≥ 2 players and everyone ready. Leaving from the result screen frees the seat. |
| DC14 | **Ruleset "12"** (owner 2026-11-22): ไฟฉาย = choose 1 opponent and see their whole hand (only you); แว่นขยาย = see the top 2 cards of the draw pile (only you); พัดลม ↔ นาฬิกาปลุก — พัดลม now only reverses direction (no draw), นาฬิกาปลุก makes the player with the fewest cards draw 1 (the old Fan ability); กุญแจ icon = padlock 🔒. Interpretation of "สลับความสามารถ…": recorded here; tell Claude if meant differently. Glue: proposal G1–G3 in `AumMon_Game_Design_Upgrade.md` §6 (open).                                                                             |
| DC15 | **Ruleset "13"** (owner chose G2, 2026-11-22): กาวน้ำ = give 1 card from your hand to a chosen player (the old "no 1–3 points next turn" effect is gone). Simulated win index 0.90–1.02.                                                                                                                                                                                                                                                                                                                                                                                |
| DC16 | **Dummy ruleset "2"** (owner 2026-11-23): ทิ้งโง่ — a discard picked by any other player before the discarder's next turn costs the discarder 50 (speto 100). Plus a "น็อค!" button for the last card and hand sorting (UI only).                                                                                                                                                                                                                                                                                                                                          |
| DC17 | **Dummy ruleset "3"** (owner 2026-11-23): ทิ้งเต็ม — a discard that forms a set or run with any two cards anywhere in the pile costs 50 (speto 100); not applied to the knock card (owner said "discard"; the knock ends the round). Draw by tapping the stock pile.                                                                                                                                                                                                                                                                                                      |
| DC18 | **Dummy ruleset "4"** (owner 2026-11-23): ทิ้งโง่ only when the next player picks just my last discard (single card), melds it and knocks in that same turn (−50, speto −100); other pick-ups cost nothing. Hand: press-and-hold drag to reorder.                                                                                                                                                                                                                                                                                                                         |
| DC19 | **Dummy ruleset "5"** (owner 2026-11-23): runs — 2 is lowest, ace only high (Q-K-A ok; A-2-3, K-A-2 not); applies to melds and ทิ้งเต็ม. ทิ้งเต็ม confirmed: any cards in the pile. Head card shown with a yellow background.                                                                                                                                                                                                                                                                                                                                                |
| DC7  | **VIP + gacha:** designed now, built later — after the core game, a legal check of payments / loot boxes and owner approval. 5–8 player rooms are free to test on Dev meanwhile.                                                                                                                                                                                                                                                                                                                                                                                       |

Rules text: `AumMon_Core_Rules.md`; cards: `AumMon_Card_Library.md`.

### 1. Summary of findings

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                       | Severity          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| F1  | **The base rule stalls the game.** "Play ≥ top, otherwise draw 1 and pass" with points 1–8: once the top is 7–8 almost nobody can play, hands only grow. Simulation (3,000 games each, no abilities): only **0.1–5 % of games ever finish**. Adding "if everyone else passes in a row, the pile resets (any card may be played)" → **~100 % finish** (2 p ≈ 15 turns, 4 p ≈ 38, 6 p ≈ 56, 8 p ≈ 106). [FOUND] | Critical          |
| F2  | **Deck size is not defined** (only 16 card types). 8 players × 5 = 40 cards dealt. [OPEN]                                                                                                                                                                                                                                                                                                                     | Critical          |
| F3  | Low cards (Eraser 1, Trash 1) can almost never be played under "≥ top"; high cards (Key 7, Umbrella 8) can be played almost anytime — "higher point = easier to play" **and** strong ability. [FOUND]                                                                                                                                                                                                         | High              |
| F4  | **Magnet** (steal a card into _your_ hand) and **Hourglass** (take a card back into _your_ hand) work against the goal of emptying your hand. [FOUND]                                                                                                                                                                                                                                                         | High              |
| F5  | **Umbrella** blocks effects aimed at you, but effects happen on other players' turns — as a normal card played on your own turn it can rarely help in time. Needs a timing rule. [OPEN]                                                                                                                                                                                                                       | High              |
| F6  | Several texts are ambiguous: Box/Scissors "latest card" (is it the card just played?), Tape (does Tape count as one of the two cards?), Alarm Clock "everyone draws" (including yourself?), ties for Magnet / Fan, duration words "next turn" / "this round". [FOUND]                                                                                                                                         | Medium            |
| F7  | Brief lists 1v1-only infrastructure today: rooms, bots, turn timer and views are built for 2 seats; the new game needs 2–8 seats, turn direction, out-of-turn reactions and partial reveals (Magnifier shows cards to one player only). Reusable as-is: auth, profiles, lobby + join codes, Realtime, server authority, idempotency, admin, sounds, UI kit. [FOUND]                                           | Medium (planning) |
| F8  | VIP rooms and the emote gacha involve **real payments and loot-box rules** (consumer/gambling regulation, minors). Needs owner approval + legal check before building; recommend designing now, building after the core game. [OPEN]                                                                                                                                                                          | High (business)   |

### 2. Proposed core rule fixes

**R1 — Pile reset (fixes F1)** [PROPOSED]
When every other player has drawn & passed in a row after your card (nobody could or wanted to play on it), the pile **resets**: you start the next turn and may play **any** card. This is the "round" used by games like President / Big Two — easy to explain: _"ถ้าทุกคนผ่านหมด คนที่ลงล่าสุดได้เริ่มใหม่ ลงอะไรก็ได้"_.

**R2 — Deck (fixes F2)** [PROPOSED]
**4 copies of each of the 16 cards = 64 cards** for every room size (simulation: 8 players finish 99.7 % with 64 cards vs 93 % with 48). One deck size keeps balance testing simple.

**R3 — Low cards are "openers" (fixes F3)** [PROPOSED]
With R1, 1-point cards become the best cards to open a reset pile; additionally **Eraser may be played on any card** (its ability already "cleans" the pile — it becomes a wild reset card). Trash stays a normal 1.

**R4 — Ability use** [BRIEF + PROPOSED]
After you play a card you **may** use its ability (optional), resolved immediately, before the next player. Abilities never let you skip the normal play rule except where the card says so (Eraser, Tape, Scissors, Ruler).

**R5 — Turn order of effects** [PROPOSED]
1 play card(s) → 2 resolve the ability → 3 reactions (Umbrella) → 4 check win → 5 next player (direction may have changed).

**R6 — Winning** [BRIEF + PROPOSED]
You win the moment your hand is empty **after a legal play** (including Tape's double play and Scissors' extra play). If an effect (Box, Trash) would leave you with 0 cards, you also win — the card that emptied the hand was still played legally. Drawing / passing can never empty a hand. Multi-round ranking: keep playing until one player is left; order = finishing order.

**R7 — Empty draw pile** [BRIEF]
Shuffle the pile (except the top card) into a new draw pile; if that is also empty, the player simply passes without drawing.

### 3. Card-by-card audit (16 cards)

| #   | Card              | Pts | Issue                                                                                   | Proposal                                                                                                                                                                                                       |
| --- | ----------------- | --: | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | หนังยาง ดีด         |   2 | Fine; cheap attack                                                                      | Keep                                                                                                                                                                                                           |
| 2   | กาวน้ำ ติดหนึบ       |   3 | "Can't play < 4 next turn" — clear                                                      | Keep; lasts until that player's next turn ends                                                                                                                                                                 |
| 3   | ยางลบ ลบเงื่อนไข    |   1 | Almost unplayable under "≥"                                                             | **Playable on any card** (wild reset) — R3                                                                                                                                                                     |
| 4   | กรรไกร ตัด         |   4 | Removes top + extra play → sheds 2 cards; "latest card" ambiguous                       | Removes the card **under** Scissors; the extra card must follow the normal rule on the new top                                                                                                                 |
| 5   | กล่องกระดาษ เก็บของ |   3 | Net −1 card and dumps any card ignoring points — strong; ambiguous target               | Takes the card **under** the Box into hand; the discarded card is placed on top **as if played** (its ability does not trigger)                                                                                |
| 6   | นาฬิกาปลุก ปลุก      |   5 | "Everyone draws" — includes you?                                                        | **Everyone except you** draws 1; direction reverses                                                                                                                                                            |
| 7   | แม่เหล็ก ดูด         |   4 | Steals a card into your hand → anti-goal (F4)                                           | **Redesign:** "ดูดติด: ส่งไพ่ 1 ใบจากมือเราไปติดผู้เล่นที่มีไพ่ **น้อยที่สุด**" (magnet sticks a card on them) — fits the goal, theme kept                                                                                      |
| 8   | แว่นขยาย ส่อง       |   2 | Info only (weak) — fine for a 2                                                         | Keep; reveal is private to you (server-side)                                                                                                                                                                   |
| 9   | ไม้บรรทัด ตีเส้น      |   5 | Next must play exactly 5 or draw & pass — strong lock, OK at 5                          | Keep; Eraser can answer it                                                                                                                                                                                     |
| 10  | เทปกาว แปะคู่       |   6 | Does Tape count as one of the two?                                                      | Tape is played normally; **then you may also play 2 more cards of equal points** (any value ≥ Tape is not required — they only need to match each other) — sheds 3 cards; strong but limited by holding a pair |
| 11  | ถังขยะ ทิ้งกาก       |   1 | Net −1, thematic                                                                        | Keep (playable on reset piles)                                                                                                                                                                                 |
| 12  | ไฟฉาย ส่องสว่าง     |   6 | Reveal everyone's hand "briefly"                                                        | Reveal for 5 s to all players, then one player draws 1                                                                                                                                                         |
| 13  | กุญแจ ล็อก          |   7 | Skip next player — strong & easy to play at 7                                           | Keep (Umbrella counters)                                                                                                                                                                                       |
| 14  | พัดลม เป่า          |   4 | Catch-up attack on the leader — good design                                             | Tie: the next player in turn order among the tied                                                                                                                                                              |
| 15  | นาฬิกาทราย ย้อนเวลา |   3 | Takes the card below the top into your hand → anti-goal unless you re-use a strong card | **Redesign option:** "ย้อนเวลา: เล่นความสามารถของไพ่ใบก่อนหน้าซ้ำอีกครั้ง" (repeat the previous card's ability) — no extra card in hand                                                                                 |
| 16  | ร่ม กางกัน          |   8 | Timing problem (F5)                                                                     | **Reaction:** may be played **out of turn** when a draw / skip effect targets you (any points); it cancels that effect and stays on top. On your own turn it is a normal 8                                     |

Points distribution today: 1×2, 2×2, 3×3, 4×3, 5×2, 6×2, 7×1, 8×1 — reasonable once R1 exists; to be tuned in Phase 3 simulation.

### 4. Open questions for the owner (ordered)

1. **R1 pile reset** — accept? (without it the game does not end)
2. **R2 deck** — 4 copies × 16 = 64 cards for all room sizes?
3. **Umbrella** — reaction out of turn (recommended) or only on your own turn?
4. **Magnet / Hourglass** — accept the redesigns, or keep the original text?
5. **Eraser** — playable on any card?
6. **Old 1v1 TCG** — remove it after the new game works (like before)? Keep Solo vs Bot and Pass & Play modes for the new game (bots for 1–7 seats)?
7. **VIP + gacha** — build after the core game, and only after a legal check of payments / loot boxes in Thailand (recommended)?

### 5. Next phases (after answers)

Phase 2: write `AumMon_Core_Rules.md`, `AumMon_Card_Library.md` (full data fields from brief §4.2) · Phase 3: engine prototype + simulations 2–8 players, `AumMon_Card_Balance.md` · Phase 4: `AumMon_Game_Architecture.md`, `AumMon_Database_Schema.md`, `AumMon_Game_Test_Plan.md` · Phase 5: `AumMon_Master_Game_Design.md`, `AumMon_Roadmap.md`, `AumMon_Master_Project_Handoff.md`. No game code until the rules are approved.
