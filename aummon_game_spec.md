# AumMon — Game Spec v5.1 (Everyday Objects Battle · 1v1 TCG)

> แหล่งอ้างอิงหลักเพียงไฟล์เดียวของ **กติกาเกม การ์ด และข้อกำหนดผลิตภัณฑ์ AumMon**
> Architecture, Database, Security, เครื่องมือ และแผนพัฒนาอยู่ใน `aummon_project_blueprint.md`
> เวอร์ชัน: 5.0 (2026-11-21; v4.0 วันเดียวกัน) — ทิศทางใหม่ "Everyday Objects Battle" ที่เจ้าของอนุมัติ (การตัดสินใจ D1–D11 ใน `docs/rule-clarifications.md` §R3; brief ต้นฉบับ `docs/design/AumMon_New_Game_Direction_Handoff.zip`)
> สถานะ: Design Baseline — **Provisional จนกว่าจะผ่าน Playtest / Balance**
> Ruleset: `ruleset_version = "4"` (Active ใช้ฟรี). Ruleset `"1"` (2–4 คน), `"2"` (Evolution / Fusion / Equipment) และ `"3"` (Active จ่าย SPARK) **ยกเลิกแล้ว** — ดูได้จาก Git history เท่านั้น

---

# 1. Product & Platform Decisions (ยืนยันโดยเจ้าของ)

## 1.1 ผลิตภัณฑ์
- Competitive Digital TCG แบบ **1v1**; ต้องมี Account; เล่นฟรีก่อน (Free now, monetization-ready later); ห้าม Pay-to-Win
- Server-authoritative: Server คำนวณผลทั้งหมด; Bot ทำงานบน Server และเห็นเฉพาะข้อมูลของ Seat ตัวเอง

## 1.2 Game Modes (1v1 ทั้งหมด)
- **Solo:** ผู้เล่น vs Server Bot
- **Pass & Play:** 2 คนเครื่องเดียว มี Privacy Handoff ระหว่างเทิร์น
- **Online:** 2 Account เข้าห้องด้วย Join Code

## 1.3 Platform rules
- ยังไม่มีระบบจัด Deck — ทั้งสองฝ่ายใช้ **Starter Deck 30 ใบ** ชุดเดียวกัน (§6.3)
- Turn timer: Solo / Online **90 วินาทีต่อเทิร์น**; หมดเวลา → Server จบเทิร์นอัตโนมัติ. Pass & Play ไม่จับเวลา
- Hand, ลำดับ Deck, RNG state เห็นเฉพาะเจ้าของและ Server; คู่แข่งเห็นแค่จำนวน. การ์ดที่ได้จาก Search ถูกเปิดเผย
- Browser ส่งเฉพาะเจตนา (card instance, target, idempotency key) ห้ามส่งผลลัพธ์

## 1.4 UI
- สถานะ Exhausted แสดงในเกมว่า **"หลับ 💤"**; หมวดหมู่ (Traits) แสดงเป็นภาษาไทย; มีหน้า "การ์ดทั้งหมด" ทั้งในหน้าหลักและในเกม
- Playful Cartoon Game UI; สีและ token ตาม `docs/color_design_system.md` (Theme A); Layout B (เต็มจอ, ลิ้นชักการ์ดในมือ)
- ข้อความในเกมเป็นภาษาไทยทั้งหมด (ชื่อการ์ด, ความสามารถ, Keyword)
- Art Direction: **Living Objects** — สิ่งของมีหน้า แขน ขา และบุคลิก; ระหว่างยังไม่มีภาพจริงใช้ภาพแทน (placeholder) (D10)

---

# 2. Vision

**AumMon — Everyday Objects Battle:** นำสิ่งของในชีวิตประจำวันมาเป็นตัวละครมีชีวิต ความสามารถของแต่ละใบต้องสะท้อนหน้าที่หรือภาพจำของสิ่งของนั้น ผู้เล่นใหม่ (12+) เข้าใจได้ทันที แต่ยังมีพื้นที่วางแผนและสร้างกลยุทธ์ Deck

หลักการออกแบบการ์ด:
1. ความสามารถสัมพันธ์กับวัตถุต้นแบบ และชื่อความสามารถสื่อภาพจำของสิ่งของ
2. แต่ละใบมี gameplay identity ของตัวเอง — ห้ามมีหลายใบที่ต่างกันแค่ชื่อ/ภาพ
3. Stats และความสามารถประเมินรวมกันเป็น Power Budget (§6.1)
4. Rarity ไม่ทำให้การ์ดเก่งกว่า (Cosmetic / Collection เท่านั้น)

---

# 3. Locked Decisions — LOCKED (เปลี่ยนได้เมื่อเจ้าของอนุมัติเท่านั้น)

## 3.1 Card Model — LOCKED
- การ์ดมีประเภทเดียว: **Object** (สิ่งของมีชีวิต) — **One Card, One Character**
- ไม่มี Action, Equipment, Field, Evolution, Fusion, Recipe (D4)
- ค่าพลัง: **ATK / HP** เท่านั้น — ไม่มี DEF (D1)
- แต่ละใบมี **Passive ได้สูงสุด 1 และ Active ได้สูงสุด 1** (D5)

## 3.2 Progression: Match-Based — LOCKED
- ทุก Match เริ่มจาก Card Definition / Deck ต้นแบบ; ไม่มี Stat Progression ข้าม Match
- การเปลี่ยนแปลงใน Match (ดาเมจ, buff, หลับ) เป็นสถานะเฉพาะ Match

## 3.3 Data Model — LOCKED
แยก Card Definitions (ข้อมูลต้นแบบ ไม่เปลี่ยนตามการเล่น), Card Instances, Match States และ Match Events

---

# 4. Core Rules

## 4.1 Match Setup
- 2 ผู้เล่น · Player HP **20** · Deck **30** · มือเริ่ม **5** · สูงสุด **3 ใบต่อ Card ID**
- สนาม: **สูงสุด 3 Objects ต่อผู้เล่น**
- Server สุ่มผู้เล่นคนแรก; คนแรกไม่จั่วในเทิร์นแรก
- Mulligan 1 ครั้ง (ทั้งสองฝ่ายก่อนเริ่ม): เลือกการ์ดคืน Deck สับ แล้วจั่วจำนวนเท่าเดิม (ส่งรายการว่างได้)
- มือสูงสุด **10 ใบ**: การ์ดที่เข้ามือตอนมือเต็มลง Discard

## 4.2 SPARK
- เทิร์นแรกของแต่ละคนมี 1; ทุก Start Phase ของตัวเอง Max SPARK +1 (สูงสุด **8**) แล้วเติมเต็ม; ไม่สะสมข้ามเทิร์น
- ใช้จ่ายค่าลงการ์ดเท่านั้น (Active Ability ใช้ฟรี); Cost ต่ำสุด 1

## 4.3 Zones
Deck · Hand · Object Zone (3 ช่อง) · Discard

## 4.4 Turn Structure
1. **Start Phase:** หมดอายุผล "จนถึงเทิร์นถัดไปของเรา", Objects ของเราตื่น (หายหลับ), +1 Max SPARK และเติม, จั่ว 1 (ยกเว้นเทิร์นแรกของเกม), จากนั้น Passive "เริ่มเทิร์นเรา" ทำงาน
2. **Main Phase:** ลง Object, ใช้ Active Ability
3. **Battle & End:** สั่ง Object ที่พร้อมโจมตี — การโจมตีครั้งแรกเข้าสู่ Battle Phase (ทางเดียว: หลังจากนั้นลงการ์ด/ใช้ Active ไม่ได้), จบเทิร์น → Passive "จบเทิร์นเรา" ทำงาน, ผล "เทิร์นนี้" หมดอายุ, ส่งเทิร์น

## 4.5 Summoning
- ต้องมีช่องว่างและ SPARK พอ; Object ใหม่เข้าสนามแบบ **หลับ (Exhausted)** ยกเว้นมี Haste
- Passive "เมื่อลงสนาม" ทำงานทันทีหลังลง

## 4.6 Combat
- โจมตีได้เฉพาะ Object ที่ **พร้อม**; ผู้โจมตีหลับจนถึง Start Phase ถัดไปของเจ้าของ
- ลำดับ: ประกาศโจมตี → ตรวจ Haste / หลับ / Flying / Guard → Passive "เมื่อโจมตี" → ดาเมจ
- **Object vs Object:** ทั้งคู่ทำดาเมจ = ATK ของตัวเองใส่กัน **พร้อมกัน**
- **Direct Attack:** ตีผู้เล่นได้เมื่อฝ่ายป้องกันไม่มี Guard ที่พร้อม (R2-4)
- **Piercing:** `Excess = max(0, ATK − HP ที่เหลือของเป้าหมายก่อนรับดาเมจ)` เข้า Player HP
- Object ที่ HP ≤ 0 ถูกทำลายลง Discard แล้ว Passive "เมื่อถูกทำลาย" ทำงาน

## 4.7 Win Conditions
- Player HP ≤ 0 แพ้ · ทั้งคู่ ≤ 0 พร้อมกัน = เสมอ
- Fatigue: ต้องจั่วแต่ Deck ว่าง เสีย HP 1, 2, 3… เพิ่มทีละ 1

---

# 5. Keywords & Abilities

## 5.1 Keywords (4 คำ — LOCKED, D6)
- **HASTE — โจมตีทันที:** เข้าสนามแบบพร้อม โจมตีได้ 1 ครั้งในเทิร์นที่ลง แล้วหลับตามปกติ
- **GUARD — โล่กำบัง:** ถ้าฝ่ายป้องกันมี Guard ที่ **พร้อม** ผู้โจมตีต้องเลือกตีตัวที่มี Guard (ตัวไหนก็ได้ถ้ามีหลายตัว); Guard ที่หลับไม่บังคับและไม่กันการตีผู้เล่น; Guard ที่บินได้บังคับเฉพาะผู้โจมตีที่บินได้ (เจ้าของยืนยัน 2026-11-21)
- **FLYING — บินได้:** ตัวที่ไม่บินโจมตีตัวที่บินไม่ได้; ตัวที่บินโจมตีได้ทุกเป้าหมาย
- **PIERCING — เจาะทะลุ:** ดาเมจส่วนเกินจากการต่อสู้เข้า Player HP (§4.6)

Keyword ไม่ใช้กับเป้าหมายของ Ability (Ability เลือกเป้าหมายข้าม Guard / Flying ได้)

## 5.2 Passive Ability (🔁 ทำงานเอง)
- **Static:** มีผลตลอดเวลาขณะ Object อยู่บนสนาม คำนวณใหม่ทุกครั้ง หยุดทันทีเมื่อ Object ออกจากสนาม (อาจทำให้ HP ลดจน Object อื่นถูกทำลาย)
- **Triggered:** ทำงานเมื่อเกิดเหตุการณ์ของตัวเอง: **เมื่อลงสนาม · เมื่อโจมตี · เมื่อถูกทำลาย · เริ่มเทิร์นเรา · จบเทิร์นเรา**
- Triggered Passive ใช้เป้าหมายอัตโนมัติเท่านั้น (ตัวเอง, ฝ่ายเราทุกตัว/ตัวอื่น, ศัตรูทุกตัว, ผู้เล่น) — ไม่มีการเลือกระหว่าง Resolution

## 5.3 Active Ability (✨ กดใช้เอง) — D2 (ปรับ 2026-11-21: ใช้ฟรี)
1. ใช้ได้เฉพาะเจ้าของ ใน **Main Phase** ของตัวเอง
2. Object ต้นทางต้อง **พร้อม**
3. ใช้ได้ **1 ครั้งต่อเทิร์นต่อ Object**
4. ตรวจเป้าหมายและเงื่อนไข **ก่อนจ่าย**; ไม่มีเป้าหมายที่ถูกต้อง = ใช้ไม่ได้
5. **ไม่ต้องจ่าย SPARK** (เจ้าของ 2026-11-21) — การ์ดที่ความสามารถแรงจะมีค่าลงสนามสูงขึ้นแทน
6. Object ต้นทาง **หลับ** ทันที — ยกเว้นการ์ดเขียนว่า **"หลับตอนจบเทิร์น"** (ยังโจมตีได้ในเทิร์นนี้ แล้วหลับเมื่อจบเทิร์น เหมือนบูสต์แล้วแบตหมด)
7. Resolve ผล → ทำลาย Object ที่ HP ≤ 0 → Passive ที่ถูกกระตุ้น → ตรวจผลแพ้ชนะ

## 5.4 Effects
ปรับ ATK (±) · เพิ่ม HP สูงสุดถาวร · ดาเมจ · ฟื้น HP (ไม่เกินค่าสูงสุด; ผู้เล่นไม่เกิน 20) · จั่ว · ทำให้หลับ · ทำให้ตื่น · ให้ Keyword · ค้นหา (การ์ดที่มี Trait ตามที่ระบุจาก Deck ขึ้นมือ เปิดเผย แล้วสับ Deck; ไม่มีการ์ดตรง = ไม่เกิดผล)

ระยะเวลา: **เทิร์นนี้** (หมดตอนจบเทิร์น) · **จนถึงเทิร์นถัดไปของเรา** (หมดตอนเริ่มเทิร์นถัดไปของเจ้าของความสามารถ) · **ถาวร** (ขณะอยู่บนสนาม). Stat bonus จากต่างแหล่ง Stack ได้; Keyword ซ้ำไม่ซ้อน

## 5.5 Resolution order & safety
- ผลของคำสั่ง → ทำลาย Object ที่ HP ≤ 0 (ฝั่งผู้เล่นที่ถือเทิร์นก่อน, วนจนไม่มีตัวตายเพิ่ม) → Passive ที่ถูกกระตุ้นเข้าคิวตามลำดับ: ผู้เล่นที่ถือเทิร์นก่อน แล้วตามตำแหน่งช่องซ้าย→ขวา; Trigger ใหม่ต่อท้ายคิว
- Trigger ที่เกิดแล้วยัง Resolve แม้ต้นทางออกจากสนาม; เป้าหมายที่หายไป = ผลนั้นไม่เกิด (ไม่ error)
- ถ้ามีผู้เล่น HP ≤ 0 ระหว่างคิว หยุดคิวและตัดสินผลทันที
- Safety: สูงสุด 100 ผลต่อหนึ่งคำสั่ง (ป้องกัน Loop) — เกินถือเป็นบั๊กของ Engine
- Idempotency key ต่อคำสั่งป้องกันการจ่ายซ้ำ

## 5.6 Traits (D7)
STATIONERY เครื่องเขียน · CONTAINER ที่เก็บของ · VEHICLE พาหนะ (ต้องเป็นสิ่งที่คนขี่/ขับได้) · ELECTRONIC เครื่องไฟฟ้า · TOOL เครื่องมือ · FREE อิสระ (สิ่งของที่ไม่อยู่ในหมวดอื่นเลย) — เป็นหมวดของสิ่งของ ไม่มีกฎในตัว แต่ Ability อ้างถึงได้ (Synergy)

---

# 6. Cards

## 6.1 Power Budget (Provisional)
`ATK + HP` ตาม Cost: 1 → 4–6 · 2 → 6–8 · 3 → 8–10 · 4 → 11–13 · 5 → 13–15 · 6 → 15–17. Object ที่มีความสามารถลดได้ไม่เกิน 3 ต่ำกว่าค่าต่ำสุด; ห้ามเกินค่าสูงสุด. Dual (Passive + Active) ต้องจ่ายมูลค่าทั้งสองอย่าง. ปรับด้วย Simulation + Playtest เท่านั้น (D11)

## 6.2 Prototype Set — 24 Objects (Provisional)
8 Passive-only · 8 Active-only · 8 Dual; Archetype ละ 6 ใบ (Aggro / Defensive / Control / Synergy). "ศัตรู" = Object ฝ่ายตรงข้าม

| ID | ชื่อ (Object) | Arch | Cost | ATK/HP | KW | Traits | 🔁 Passive | ✨ Active (ฟรี) |
|---|---|---|---:|---:|---|---|---|---|
| O01 | ดินสอไม้ (Pencil) | Aggro | 1 | 2/2 | – | STATIONERY | ไส้หัก: เมื่อถูกทำลาย: ดาเมจ 1 ใส่ผู้เล่นฝ่ายตรงข้าม | – |
| O02 | รถแข่งจิ๋ว (Toy Racer) | Aggro | 3 | 2/3 | Haste | VEHICLE | เร่งเครื่อง: เมื่อโจมตี: +1 ATK เทิร์นนี้ | เทอร์โบ: +2 ATK เทิร์นนี้ ยังโจมตีได้ แล้วหลับตอนจบเทิร์น (แบตหมด) |
| O03 | หนังยาง (Rubber Band) | Aggro | 2 | 1/2 | – | STATIONERY | – | ดีด: ดาเมจ 1 ใส่ศัตรูหรือผู้เล่นฝ่ายตรงข้าม |
| O04 | จักรยาน (Bicycle) | Aggro | 3 | 3/4 | Haste | VEHICLE | ปั่นเป็นขบวน: +1 ATK ถ้ามีพาหนะตัวอื่นฝ่ายเรา | – |
| O05 | กรรไกร (Scissors) | Aggro | 3 | 3/2 | Piercing | STATIONERY, TOOL | – | ตัดฉับ: ดาเมจ 2 ใส่ศัตรู 1 ตัว |
| O06 | จรวดขวดน้ำ (Bottle Rocket) | Aggro | 4 | 3/5 | Flying | FREE | จุดชนวน: เมื่อลงสนาม: ดาเมจ 1 ใส่ผู้เล่นฝ่ายตรงข้าม | พุ่งชน: ดาเมจ 2 ใส่ผู้เล่นฝ่ายตรงข้าม |
| O07 | กระเป๋าเป้ (Backpack) | Defensive | 2 | 1/5 | Guard | CONTAINER | ช่องกันกระแทก: Object อื่นฝ่ายเรา +1 HP | ช่องฉุกเฉิน: ฟื้น 2 HP ให้ Object ฝ่ายเรา 1 ตัว |
| O08 | กล่องกระดาษ (Cardboard Box) | Defensive | 1 | 0/5 | Guard | CONTAINER | ของในกล่อง: เมื่อถูกทำลาย: จั่ว 1 ใบ | – |
| O09 | ร่ม (Umbrella) | Defensive | 2 | 2/4 | Guard | FREE | กางรับฝน: เริ่มเทิร์นเรา: ฟื้น 2 HP ให้ตัวเอง | – |
| O10 | กระติกน้ำแข็ง (Cooler) | Defensive | 3 | 2/6 | Guard | CONTAINER | – | ประคบเย็น: ฟื้น 3 HP ให้ Object ฝ่ายเราหรือผู้เล่นเรา |
| O11 | หมวกกันน็อก (Helmet) | Defensive | 2 | 2/4 | – | FREE | – | สวมกันกระแทก: Object อื่นฝ่ายเราได้ โล่กำบัง จนถึงเทิร์นถัดไปของเรา |
| O12 | ประตูไม้ (Wooden Door) | Defensive | 5 | 2/8 | Guard | FREE | ปิดบ้าน: เมื่อลงสนาม: ฟื้น 3 HP ให้ผู้เล่นเรา | ล็อกประตู: ทำให้ศัตรูที่พร้อม 1 ตัวหลับ |
| O13 | นาฬิกาปลุก (Alarm Clock) | Control | 3 | 2/3 | – | ELECTRONIC | ปลุกเช้า: เมื่อลงสนาม: จั่ว 1 ใบ | เลื่อนปลุก: ทำให้ศัตรูที่พร้อม 1 ตัวหลับ |
| O14 | ยางลบ (Eraser) | Control | 4 | 2/6 | – | STATIONERY | – | ลบทิ้ง: ดาเมจ 3 ใส่ศัตรู 1 ตัว |
| O15 | ไฟฉาย (Flashlight) | Control | 3 | 2/3 | – | ELECTRONIC | แสงจ้า: เมื่อลงสนาม: ดาเมจ 1 ใส่ศัตรูทุกตัว | – |
| O16 | กาวน้ำ (Glue) | Control | 2 | 1/4 | – | STATIONERY | – | ติดหนึบ: ศัตรู 1 ตัว −2 ATK จนถึงเทิร์นถัดไปของเรา |
| O17 | เครื่องดูดฝุ่น (Vacuum) | Control | 6 | 5/7 | – | ELECTRONIC | ดูดพลัง: เมื่อลงสนาม: ศัตรูทุกตัว −1 ATK จนถึงเทิร์นถัดไปของเรา | ดูดแรง: ดาเมจ 2 ใส่ศัตรู 1 ตัว |
| O18 | วิทยุ (Radio) | Control | 3 | 1/4 | – | ELECTRONIC | ข่าวต้นชั่วโมง: เริ่มเทิร์นเรา: จั่ว 1 ใบ | – |
| O19 | กล่องดินสอ (Pencil Case) | Synergy | 2 | 1/4 | – | CONTAINER, STATIONERY | เก็บครบชุด: เครื่องเขียนตัวอื่นฝ่ายเรา +1 ATK | – |
| O20 | ปลั๊กพ่วง (Power Strip) | Synergy | 3 | 1/4 | – | ELECTRONIC | – | จ่ายไฟ: เครื่องไฟฟ้าตัวอื่นฝ่ายเราที่หลับ ตื่นกลับมาพร้อม |
| O21 | ประแจ (Wrench) | Synergy | 3 | 2/3 | – | TOOL | หยิบเครื่องมือ: เมื่อลงสนาม: ค้นหาเครื่องมือ 1 ใบจากเด็คขึ้นมือ | ขันแน่น: Object ฝ่ายเรา 1 ตัว +2 HP ถาวร |
| O22 | ค้อน (Hammer) | Synergy | 3 | 3/4 | – | TOOL | ทีมช่าง: +1 ATK ต่อเครื่องมือตัวอื่นฝ่ายเรา | – |
| O23 | ไขควง (Screwdriver) | Synergy | 1 | 2/2 | – | TOOL | – | ไขทะลุ: เครื่องมือตัวอื่นฝ่ายเราได้ เจาะทะลุ เทิร์นนี้ |
| O24 | รถบรรทุกของเล่น (Toy Truck) | Synergy | 5 | 3/7 | – | VEHICLE | ขนของ: เมื่อลงสนาม: ค้นหาพาหนะ 1 ใบจากเด็คขึ้นมือ | ส่งของ: ฟื้น 2 HP ให้ Object ฝ่ายเราทุกตัว |

ข้อมูลเดียวกันอยู่ในโค้ดที่ `packages/game-engine/src/rules/v4/cards.ts` และ migration ruleset 4 (มี drift test)

## 6.3 Starter Deck v4 (30, Provisional)
ทุกใบ O01–O24 อย่างละ 1 + ใบที่สองของ O01, O03, O08, O13, O19, O23

## 6.4 Card Data Contract
`card_id`, `name` (ไทย), `name_en`, `archetype`, `rarity`, `cost`, `atk`, `hp`, `keywords`, `traits`, `passive`, `active`, `flavor`, `definition_version`

## 6.5 Scenario Tests (ต้องผ่านแบบอัตโนมัติ)
Active: ต้นทางตื่น/หลับ · ใช้ฟรีแม้ SPARK เป็น 0 · ใช้ซ้ำในเทิร์นเดียว · เป้าหมายผิด/หายไปก่อน Resolve (ต้นทางไม่หลับ) · หลับตอนจบเทิร์น. Passive: หลาย Trigger พร้อมกัน (ลำดับ) · Trigger ต่อเนื่อง + Loop limit · ทำลายที่ HP 0 · ต้นทางออกจากสนามระหว่าง Resolution · Static หยุดแล้ว HP ลดจนถูกทำลาย · Guard ที่ได้ "จนถึงเทิร์นถัดไป" หมดอายุถูกเวลา · คำขอซ้ำ (idempotency)

---

# 7. Balance & Validation
- Simulation อัตโนมัติ: ≥ 1,000 เกมสุ่มไม่มี error, Bot vs Bot, Bot ชนะผู้เล่นสุ่มส่วนใหญ่
- Playtest วัด: Active vs โจมตี (มีการตัดสินใจจริง), แรงกดดัน SPARK, มูลค่า Dual, ความเข้าใจของผู้เล่นใหม่, ความต่างของ 4 Archetype, Win rate ต่อการ์ด/Archetype
- ห้ามปรับ Balance จากความรู้สึกอย่างเดียว; Stats และ Ability ปรับพร้อมกัน

---

# 8. Versioning & Change Control
- การเปลี่ยนที่กระทบผลเกมต้องอัปเดต Spec, Test และ `ruleset_version`
- Change Request ระบุ: กฎเดิม / กฎใหม่ / เหตุผล / การ์ดที่กระทบ / ผลต่อ Engine / Data migration / Tests / Balance / Rollback

---

# 9. Open Issues (ยังไม่ล็อก)
1. Rarity และจำนวนการ์ดชุดเปิดตัว (D11)
2. Power Budget แบบตัวเลขละเอียดหลัง Playtest
3. ภาพการ์ดจริง (Living Objects) และ Legal review ของ Art
4. ระบบจัด Deck / Collection / Ranked / Economy (ต้องแยกจาก Competitive Power)
5. Timing พิเศษ (ใช้ความสามารถระหว่าง Combat / ตอบโต้) — ยังไม่มีใน v4.0

---

# Appendix — Change Log

## 2026-11-21 — v5.1 Categories (ruleset "4" คงเดิมตามที่เจ้าของเลือก)
- ภาชนะ → "ที่เก็บของ"; ของใช้ในบ้าน → หมวด "อิสระ" (FREE) สำหรับของที่ไม่อยู่ในหมวดอื่น: ร่ม, หมวกกันน็อก, ประตูไม้, จรวดขวดน้ำ
- จรวดขวดน้ำไม่อยู่ในหมวดพาหนะ (คนขี่/ขับไม่ได้); เครื่องดูดฝุ่นเป็นเครื่องไฟฟ้าอย่างเดียว

## 2026-11-21 — v5.0 Free Actives (ruleset "4")
- เจ้าของปรับ: Active Ability ใช้ฟรี ไม่ต้องจ่าย SPARK (กฎอื่นคงเดิม: Main Phase, ต้องตื่น, ใช้แล้วหลับ, ตัวละ 1 ครั้ง/เทิร์น)
- การ์ดที่ Active แรงขึ้นค่าลงสนาม: O02, O03, O05, O06, O12, O13, O14, O17, O20, O21, O24 (ปรับ ATK/HP ให้อยู่ใน Power Budget)
- รถแข่งจิ๋ว "เทอร์โบ": ใช้แล้วยังโจมตีได้ แล้วหลับตอนจบเทิร์น (แบตหมด)
- ในเกมเรียกสถานะ Exhausted ว่า "หลับ"; ข้อความการ์ดใช้ชื่อหมวดหมู่ภาษาไทย

## 2026-11-21 — v4.0 Everyday Objects Battle (ruleset "3")
- เจ้าของอนุมัติทิศทางใหม่และคำแนะนำทั้งหมด (D1–D11): Object Cards เท่านั้น, Passive + Active, ATK/HP, Keywords 4 คำ, Traits สำหรับ Synergy
- ถอด Action / Equipment / Field / Evolution / Fusion / Recipe Library / Boost keyword / Draw-Search keyword
- เพิ่มกฎ Ability (§5.2–5.5), การ์ด 24 ใบ และ Starter Deck v3
- Spec v3.0 (ruleset "2") และ Core Rules V1.1 ส่วนที่ไม่ได้ใช้ต่อ ดูได้จาก Git history
