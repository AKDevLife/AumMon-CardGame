# AumMon — Casual Discard Edition · Phase 1 Game Design Audit & Rule Clarification

> Status: **Owner decisions recorded 2026-11-22 (§0)**; remaining small rulings marked PROPOSED.
> Source: owner brief "AumMon — Everyday Objects Battle · Master Game Design & Development Handoff" (2026-11-22).
> Status 2026-11-22: implemented — the 1v1 TCG has been removed (task 12.6); login, sign-up, profile, UI/UX, sounds, admin and other non-rule systems are kept as they are.
> Labels: **[BRIEF]** = owner's text · **[FOUND]** = verified by analysis / simulation · **[PROPOSED]** = my recommendation · **[OPEN]** = owner must decide.

## 0. Owner decisions (2026-11-22) — APPROVED

| ID  | Decision                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DC1 | **Pile reset:** when every other player draws & passes in a row, the last player who played starts again and may play any card (R1).                                             |
| DC2 | **Deck:** 16 cards × 4 copies = **64 cards** for every room size (R2).                                                                                                           |
| DC3 | **Umbrella is a reaction:** may be played out of turn when a draw / skip effect targets you (any points).                                                                        |
| DC4 | **Magnet and Hourglass redesigned** as proposed in §3.                                                                                                                           |
| DC5 | **Eraser may be played on any card.**                                                                                                                                            |
| DC6 | The 1v1 TCG is removed once the new game works; the new game keeps **Solo vs Bots (1–7 bots), Pass & Play and Online**.                                                          |
| DC7 | **VIP + gacha:** designed now, built later — after the core game, a legal check of payments / loot boxes and owner approval. 5–8 player rooms are free to test on Dev meanwhile. |

Rules text: `AumMon_Core_Rules.md`; cards: `AumMon_Card_Library.md`.

## 1. Summary of findings

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

## 2. Proposed core rule fixes

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

## 3. Card-by-card audit (16 cards)

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

## 4. Open questions for the owner (ordered)

1. **R1 pile reset** — accept? (without it the game does not end)
2. **R2 deck** — 4 copies × 16 = 64 cards for all room sizes?
3. **Umbrella** — reaction out of turn (recommended) or only on your own turn?
4. **Magnet / Hourglass** — accept the redesigns, or keep the original text?
5. **Eraser** — playable on any card?
6. **Old 1v1 TCG** — remove it after the new game works (like before)? Keep Solo vs Bot and Pass & Play modes for the new game (bots for 1–7 seats)?
7. **VIP + gacha** — build after the core game, and only after a legal check of payments / loot boxes in Thailand (recommended)?

## 5. Next phases (after answers)

Phase 2: write `AumMon_Core_Rules.md`, `AumMon_Card_Library.md` (full data fields from brief §4.2) · Phase 3: engine prototype + simulations 2–8 players, `AumMon_Card_Balance.md` · Phase 4: `AumMon_Game_Architecture.md`, `AumMon_Database_Schema.md`, `AumMon_Game_Test_Plan.md` · Phase 5: `AumMon_Master_Game_Design.md`, `AumMon_Roadmap.md`, `AumMon_Master_Project_Handoff.md`. No game code until the rules are approved.
