# Rule Clarifications

> **2026-11-20:** เกมเปลี่ยนเป็น TCG 1v1 (Spec v3.0, `ruleset_version = "2"`). Q1–Q12 ด้านล่างใช้กับ ruleset 1 (2–4 คน, เลิกใช้) — เก็บไว้เป็นประวัติ. ประเด็นของ ruleset 2 อยู่ในหัวข้อ R2-*

> ไฟล์นี้ **ไม่แก้ไข** กติกา 15 ข้อใน `aummon_game_spec.md` §7 — เป็นการตีความรายละเอียดที่ Spec ยังไม่ได้ระบุ
> **Provisional** = เจ้าของผลิตภัณฑ์มอบหมายให้เลือกวิธีที่เหมาะสมไปก่อน (2026-11-19) และจะปรับหลัง Playtest
> การปรับภายหลังที่กระทบผลเกม ให้บันทึกที่นี่และพิจารณาเพิ่ม `ruleset_version`

## สถานะ

| #   | หัวข้อ                 | สถานะ          | บล็อกงาน      |
| --- | -------------------- | -------------- | ------------ |
| 1   | Chaos deck mix       | ✅ Provisional | Seed, Engine |
| 2   | Redirect semantics   | ✅ Provisional | Engine, API  |
| 3   | Chaos speed swap     | ✅ Provisional | Engine       |
| 4   | Pyro bonus timing    | ✅ Provisional | Engine       |
| 5   | AoE as a Hit         | ✅ Provisional | Engine       |
| 6   | Support edge cases   | ✅ Provisional | Validator    |
| 7   | Aqua activation      | ✅ Provisional | Engine, API  |
| 8   | Card zones           | ✅ Provisional | Engine       |
| 9   | Targeting            | ✅ Provisional | Validator    |
| 10  | Duplicate characters | ✅ Provisional | Lobby        |
| 11  | Timeout scope        | ✅ Provisional | Server       |
| 12  | Bot difficulty       | ✅ Provisional | Bot          |

## Provisional decisions

### Q1 — Chaos deck mix (Rule 5, Rule 8)

- การ์ด `chaos` 6 ใบ แบ่งเท่ากัน: **Redirect 2 · AoE 2 · Disrupt 2**
- Card definition IDs: `chaos_redirect`, `chaos_aoe`, `chaos_disrupt` (การ์ดพื้นฐานอื่น: `attack`, `defense`, `support`)
- เหตุผล: สมดุลง่าย ทุก Effect มีโอกาสออกเท่ากัน ปรับจำนวนได้ผ่าน Deck Template version

### Q2 — Redirect (Rule 5)

- ผู้เล่นเลือกเป้าหมายใหม่ **X** 1 คน (ยังมีชีวิต, ไม่ใช่ตัวเอง) ตอน Select
- ผล: ทุก Action แบบ **เป้าหมายเดี่ยว** (`attack`, `chaos_disrupt`) ที่เล็งมาที่ผู้ใช้ Redirect ในรอบนี้ จะเปลี่ยนไปโดน X แทน (X เป็นผู้โจมตีเองได้ = สะท้อนกลับ)
- ทำงาน **ตลอดทั้งรอบโดยไม่ขึ้นกับ speed** เหมือน Defense (Rule 4) — ตัดปัญหาว่า Redirect ช้ากว่าการโจมตี
- ไม่มีผลกับ AoE (ไม่มีเป้าหมายเดี่ยว) และไม่ส่งต่อซ้ำ (Redirect เปลี่ยนเป้าได้ 1 ครั้งต่อ Action — กัน loop)
- ถ้า X ถูกคัดออกก่อน Action นั้นทำงาน → Fizzle ตาม Rule 3
- Command ใช้ `targetPlayerId` ช่องเดียว (ไม่ต้องเพิ่มฟิลด์)

### Q3 — Chaos speed swap (Rule 2)

- Rulebook v1 **ไม่มี** การ์ด Chaos ที่เปลี่ยนลำดับ speed; ทุก Match ใช้ base speed เสมอ
- ข้อความใน Rule 2 ถือเป็นช่องสำหรับการ์ดในอนาคต (ต้องใช้ ruleset ใหม่)

### Q4 — Pyro `BONUS_DMG_FIRST_HIT` (Rule 10 vs Rule 12)

- `onAttack` ของ Pyro "ติดป้าย" โบนัสไว้กับ Hit นั้น แต่ **ยังไม่บวก**
- คำนวณดาเมจฐานผ่าน Breeze → Terra → Defense Shield ก่อน; ถ้าเหลือ ≥ 1 จึง **+1** แล้วหัก HP และใช้สิทธิ์ของรอบ
- โบนัส +1 ไม่ถูกลดซ้ำ; ถ้าเหลือ 0 สิทธิ์ยังอยู่สำหรับ Hit ถัดไปในรอบเดียวกัน
- ผลข้างเคียงที่ยอมรับ: Pyro ตี Terra ด้วยการ์ด `attack` (1 ดาเมจ) จะไม่ได้โบนัส — ตรงตามถ้อยคำ Rule 10

### Q5 — AoE as a Hit (Rule 5, 9, 10)

- AoE = **1 Hit แยกกันต่อเป้าหมาย** (ดาเมจ 1) ใส่ผู้เล่นอื่นทุกคนที่ยังมีชีวิต เรียงตาม speed มาก→น้อย (เท่ากันใช้ seat)
- แต่ละ Hit ผ่าน `onBeforeDamaged` (Breeze → Terra) → Shield → HP → `onAfterDamaged` ตามปกติ
- โบนัส Pyro ใช้กับการ์ด `attack` เท่านั้น ไม่ใช้กับ AoE
- Disrupt ไม่ทำดาเมจ จึงไม่ใช่ Hit (ไม่ทริกเกอร์ Breeze/Terra/Shield); เป้าหมายมือว่าง = ไม่มีผล

### Q7 — Aqua `SWAP_CARD_ONCE` (Rule 11)

- **ผู้เล่นเลือกใช้เอง** (ไม่ auto) ใน Sub-phase `turn_start` หลังจั่วไพ่ ก่อน Select
- Sub-phase เกิดเฉพาะเมื่อ Aqua ยังมีชีวิต, ยังไม่เคยใช้สกิล, มีไพ่ ≥ 1 ใบ และมีผู้เล่นอื่นที่ยังมีชีวิตซึ่งมีไพ่ ≥ 1 ใบ
- ตัวเลือก: เลือกเป้าหมาย (สลับ) หรือข้าม; หมดเวลา **15 วินาที** หรือ Disconnect = ข้ามอัตโนมัติ (สิทธิ์ยังอยู่)
- การสลับ: สุ่มไพ่ 1 ใบจากมือ Aqua ↔ สุ่ม 1 ใบจากมือเป้าหมาย (ทั้งสองฝั่งสุ่มด้วย RNG ฝั่ง Server)
- Public event แจ้งแค่ "Aqua สลับไพ่กับ X" — ไม่เปิดเผยการ์ด
- Bot: ใช้ทันทีในรอบแรกที่ใช้ได้ โดยเลือกคู่แข่งที่ HP สูงสุด (เท่ากันใช้ seat น้อย)
- Implementation: เพิ่ม phase `turn_start` และ Command ใช้สกิลแยก (`matches-use-skill`) — 15 วินาทีปรับได้หลัง Playtest

### Q6 — Support (Rule 6)

- `draw` เลือกได้แม้มือมี 5 ใบตอน Select (เล่น Support แล้วเหลือ 4 จึงจั่วได้ 1)
- `heal` ตอน HP เต็มเป็น Action ที่ legal แต่ไม่มีผล (UI แสดงคำเตือน; Bot ไม่เลือก)
- `draw` เมื่อ Deck และ Discard ว่าง = ไม่มีผล (Rule 8)

### Q8 — Card zones (Rule 8, 13)

- การ์ดที่เล่นแล้วไป Discard หลัง Action นั้น Resolve
- Action ที่ถูกยกเลิก (Rule 13): การ์ดไป Discard
- ผู้ถูกคัดออก: ไพ่ในมือทั้งหมดไป Discard ทันที
- ผล: การ์ดครบ 40 ใบเสมอ (Card conservation test)

### Q9 — Targeting (Rule 3, 5)

- `attack`, `chaos_disrupt`, `chaos_redirect`: ต้องเลือกผู้เล่นอื่นที่ยังมีชีวิต 1 คน — เลือกตัวเองไม่ได้
- `defense`, `support`, `chaos_aoe`: ไม่มี target (Server ปฏิเสธถ้าส่งมา)

### Q10 — Duplicate characters

- ตัวละครห้ามซ้ำใน Match เดียวกัน (มี 4 ตัว รองรับ 4 ผู้เล่นพอดี; อ่านกระดานง่าย)

### Q11 — Timeout scope (Rule 14)

- Solo และ Online: Timeout 30 วินาที → Server Bot เลือกแทน
- Pass & Play: ไม่มี Timeout (มีช่วงส่งเครื่อง/Privacy Handoff)

### Q12 — Bot difficulty

- v1 มีระดับเดียว `normal` (heuristic ตาม Blueprint §5.6); โครงสร้างรองรับ `easy`/`hard` ภายหลังผ่าน weights

## C1 — Master Handoff (1v1 TCG) vs Rulebook v1 — ✅ Resolved 2026-11-20

เจ้าของเลือกเปลี่ยนเกมทั้งหมดเป็น TCG 1v1 ตาม Handoff v1.1 และรวมเป็น `aummon_game_spec.md` v3.0 ไฟล์เดียว; คงเมนู/Auth/ระบบอื่นเดิม. คงทั้ง 3 โหมด (1v1), Starter Deck สำเร็จรูป, Turn timer 90 วินาที → จบเทิร์นอัตโนมัติ.

## R2-1 — Spec v3.0 internal leftovers from V1.0 — ⏳ open (blocks 8.4 combat details only)

Spec §5.12, §5.14 และ §5.17 ยังอ้าง DEF, Overclock, Reinforce, Unstable, Modular, Ancient, Recycle ของ Design V1.0 ซึ่งขัดกับ §4.7 (ATK/HP เท่านั้น) และ §5.2/§5.18 (6 Keywords).

- **Provisional:** ยึด §4 (Core Rules V1.1), §5.18 และ §6.5–6.6 เป็นหลัก; ข้อความ V1.0 ที่ขัดกันไม่นำมา Implement (ตัวอย่าง: Boost +2 ATK ไม่ใช่ Overclock; Piercing = ATK − HP ปัจจุบัน ไม่มี DEF)
- ให้เจ้าของยืนยันก่อนเริ่มงาน 8.4
