# AumMon — Rank System (15.8)

> Status: **APPROVED by owner 2026-11-25 (E1–E4), design only — built post-MVP** (15.8, audit P4). Server-authoritative; nothing affects game results (no pay-to-win). Ranked is account-only (Q3); fixed BLUFF sizes 4 and 6 (M3).

## 1. Rating

- Multiplayer skill rating **OpenSkill (Weng-Lin / Plackett-Luce)** — open-source, works for free-for-all placements, no licence cost. Per account × game × size bucket: `mu`, `sigma`.
- Shown rating = round((mu − 3 σ) × 40 + 1000) — rises as the system becomes confident.
- Placement: first 5 Ranked matches show "กำลังจัดอันดับ"; tier appears after.
- Ties use the approved tie-break; a shared place counts as a tie in the rating update.

## 2. Tiers (funny bluff-themed names, owner request 2026-11-25)

Order goes from "easy to read" to "unreadable", so the joke also tells the skill level. Each tier has I–III steps (display only) and a fixed icon + colour so the order is clear without reading.

| #   | Tier (TH)  | EN label        | Shown rating                 | Icon | Joke / meaning               |
| --- | ---------- | --------------- | ---------------------------- | ---- | ---------------------------- |
| 1   | หน้าใส      | Open Book       | < 1100                       | 😇   | ทุกคนอ่านออกหมด โกหกแล้วหูแดง    |
| 2   | เนียนนิดหน่อย | Kinda Smooth    | 1100–1249                    | 😏   | เริ่มตบตาได้ แต่ยังหลุดขำ          |
| 3   | ตีหน้าตาย    | Poker Face      | 1250–1399                    | 😐   | หน้านิ่งจนเพื่อนเริ่มไม่ไว้ใจ         |
| 4   | นักแสดงนำ   | Drama Star      | 1400–1549                    | 🎭   | เล่นใหญ่ เล่นจริง ห้องเชื่อทั้งห้อง    |
| 5   | เซียนอ่านใจ  | Mind Reader     | ≥ 1550                       | 🔮   | อ่านทุกคนออก แต่ไม่มีใครอ่านเราออก |
| ★   | ราชันย์ตบตา  | Grand Trickster | top 100 of tier 5 per season | 👑   | ตำนานของซีซัน                  |

- Names never insult the player (no "โง่", no rude slang); final wording reviewed with the 15.5 UI copy.

## 3. Seasons

- 8 weeks. Soft reset: sigma raised toward the start value, mu moved 50 % toward the default. End-of-season cosmetic reward (frame with the tier icon) by highest tier reached.

## 4. Integrity

- Solo queue only at first (no premade parties); two accounts from the same device / IP hash are never placed in one match.
- Account must have a confirmed e-mail and ≥ 3 finished Casual matches.
- AFK (≥ 50 % phases timed out) or leaving = counted as last place + 5 min queue cooldown (doubling, reset daily).
- Rating changes are written by the server in the match-finish transaction; history kept (`rating_history`, append-only) for admin review and rollbacks after cheating reports.
