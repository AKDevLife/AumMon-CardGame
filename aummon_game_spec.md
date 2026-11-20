# AumMon — Game Spec v3.0 (1v1 TCG · Core Rules V1.1)

> แหล่งอ้างอิงหลักเพียงไฟล์เดียวของ **กติกาเกม การ์ด และข้อกำหนดผลิตภัณฑ์ AumMon**  
> Architecture, Database, Security, เครื่องมือ และแผนพัฒนาอยู่ใน `aummon_project_blueprint.md`  
> เวอร์ชัน: 3.0 (2026-11-20) — รวมจาก `AumMon_Master_Project_Handoff.md` (v1.1) ตามที่เจ้าของโปรเจกต์อนุมัติ  
> สถานะ: Design Baseline V1.1 — ยังไม่ผ่าน Playtest / Balance Validation  
> Ruleset: ระบบใช้ `ruleset_version = "2"` สำหรับกติกาชุดนี้ (Design V1.1). กติกาเก่า 2–4 คน (`ruleset_version = "1"`) **ยกเลิกแล้ว** — ดูได้จาก Git history เท่านั้น  
> หมายเลขหัวข้อ 2–6, 8, 10, 11 คงตามเอกสาร Handoff ต้นฉบับเพื่อให้อ้างอิงตรงกัน

---

# 1. Product & Platform Decisions (คงเดิม / ยืนยันโดยเจ้าของ 2026-11-20)

## 1.1 ผลิตภัณฑ์

- ประเภท: Competitive Digital TCG แบบ **1v1 (2 ผู้เล่น)**
- Membership: ต้องมี Account (สมัคร/ล็อกอิน/โปรไฟล์/ลบบัญชี คงเดิม)
- Business model: เล่นฟรีก่อน (**Free now, monetization-ready later**); ห้าม Pay-to-Win
- หลักความถูกต้อง: Server-authoritative — Server คำนวณผลทั้งหมด
- Bot: ทำงานและตัดสินใจบน Server เท่านั้น
- เมนู, หน้า Auth, Lobby, UI Design System และระบบอื่นนอกตัวเกม **คงเดิม**; เปลี่ยนเฉพาะกติกาเกมและการ์ด

## 1.2 Game Modes (ทั้ง 3 โหมดคงไว้ เป็น 1v1)

- **Solo:** ผู้เล่น 1 คน vs Server Bot 1 ตัว
- **Pass & Play:** 2 ผู้เล่นเครื่องเดียว มี Privacy Handoff ระหว่างเทิร์น
- **Online:** 2 Account คนละเครื่อง เข้าห้องด้วย Join Code

## 1.3 Platform rules

- **Deck (ระยะแรก):** ยังไม่มีระบบจัด Deck — ทั้งสองฝ่ายใช้ **Starter Deck 30 ใบ** ชุดเดียวกัน (§1.5)
- **Turn timer:** Solo และ Online มีเวลา **90 วินาทีต่อเทิร์น**; หมดเวลา Server **จบเทิร์นอัตโนมัติ** (ไม่ให้ Bot เล่นแทน). Pass & Play ไม่มีจับเวลา
- Forfeit / Resume / Reconnect คงเดิม (ดึงสถานะจาก Server)
- Hand, ลำดับ Deck, ผลค้นหา (Search) และ RNG state มองเห็นได้เฉพาะเจ้าของและ Server; คู่แข่งเห็นเพียงจำนวนการ์ดในมือ/Deck
- Browser ส่งเฉพาะเจตนา (card instance, target, choice, idempotency key) ห้ามส่งผลลัพธ์
- Bot ได้รับเฉพาะข้อมูลที่ Seat ของตนมีสิทธิ์เห็น

## 1.4 UI Design System (คงเดิม)

- Style: Playful Cartoon Game UI
- Border: `3px solid #2a1650`
- Sticker shadow: `0 5px 0 #2a1650`
- Pressed state: `translateY(3px)` และ shadow `0 2px 0 #2a1650`
- Fonts: Fredoka, Kanit (ตรวจ License/การโหลด Font ก่อนใช้จริง)

| Use | Color |
|---|---|
| Background | `#f6f0ff` |
| Decoration | `#e6d8ff`, `#d3f5e8`, `#ffe6a8` |
| Main text / border | `#2a1650` |
| Secondary text | `#6d5a9a` |
| Accent text | `#5b2fb8` |
| Round / game badge | `#ff2d9b` |
| Header / title | `#ffc21a` |
| Card / button / number box | `#fffbe6` |
| Hover | `#ffe36e` |
| Start / confirm | `#4cc35e` |
| Alert / damage | `#e8244f` |

## 1.5 Starter Deck (Provisional — ปรับหลัง Playtest)

ใช้เฉพาะการ์ดที่ลงเด็คได้จาก §6.5.4 (Stage 0 Units, Actions, Equipment); ร่าง Evolution/Fusion (U101–U108, U201–U203) ไม่อยู่ในเด็ค — สร้างผ่าน Recipe เท่านั้น. ทุกแบบไม่เกิน 3 ใบ.

| Card ID | Name | Copies |
|---|---|---:|
| U001 | Rubber Duckling | 2 |
| U002 | Tin Can Guardian | 2 |
| U003 | Paper Glider | 2 |
| U004 | Pocket Flashlight | 2 |
| U005 | Mini Skateboard | 2 |
| U006 | Thermos Golem | 2 |
| U007 | Battery Buddy | 2 |
| U008 | Wind-up Robot | 2 |
| A001 | Quick Doodle | 3 |
| A002 | Lost & Found | 2 |
| A003 | Scrap Return | 2 |
| E001 | Clip-on Propeller | 2 |
| E002 | Reinforced Lid | 2 |
| E003 | Power Charger | 3 |
| **รวม** | Unit 16 · Action 7 · Equipment 7 | **30** |

---

# 2. Product Vision และขอบเขตเกม

## 2.1 ชื่อและแนวคิด
- Project name: **AumMon**
- Working concept / Theme: **EVERYDAY ITEM BATTLE**
- Genre: Competitive Digital TCG
- Players: 1v1
- Theme: สิ่งของในชีวิตประจำวันมีชีวิตขึ้นมาต่อสู้
- Core differentiator: Infinite Evolution + Modification + Attachment + Fusion

ชื่อ EVERYDAY ITEM BATTLE เป็นชื่อแนวคิด/ชื่อชั่วคราว ไม่ถือเป็นชื่อแบรนด์สุดท้ายจนกว่าจะยืนยัน

## 2.2 Core Gameplay Loop
1. ผู้เล่นสร้าง/เลือก Deck ตามกฎ Deck Construction
2. เริ่ม Match โดยทุกคนใช้ Card Definitions ตาม Deck ที่เลือก
3. จั่วการ์ดและจัดการ SPARK
4. Summon Unit และใช้ Action / Equipment / Material
5. ทำ Evolution, Modification หรือ Fusion เพื่อเปลี่ยนแผนการเล่น
6. ต่อสู้และจัดการทรัพยากร
7. ลด HP ของ Player ฝ่ายตรงข้ามจนถึงเงื่อนไขชนะ
8. จบ Match แล้ว Reset Combat / Evolution State
9. บันทึกผลการแข่งขันและ Collection / Cosmetic Progression โดยไม่มีผลเพิ่มพลังใน Ranked

## 2.3 Competitive Fairness
- Match-Based Progression เป็นแนวทางที่ล็อกแล้ว
- ไม่มีการสะสม Stage, XP หรือ Stat Bonus ข้ามแมตช์
- Ranked ต้องไม่ Pay-to-Win
- Cosmetic / Collection / Achievement ปลดล็อกได้ แต่ไม่มีผลต่อ Stat หรือความสามารถในการแข่งขัน
- Card Ownership / Unlock Rules ต้องไม่ทำให้ Ranked Match ไม่ยุติธรรม

---

# 3. Locked Decisions — การตัดสินใจที่ยืนยันแล้ว

## 3.1 Evolution Format: Hybrid (Accessible V1.1) — LOCKED
เมื่อ Unit ทำ Evolution:
- Card Definition ใหม่เข้ามาแทนรูปแบบเดิมบนสนาม
- Card Instance ยังคง **Instance ID เดิม**
- เก็บ Evolution History
- **ได้รับ HP เต็มตามค่า Max HP ของการ์ดร่างใหม่ทันที** (ไม่ต้องนำ Damage เดิมมาหักลบ)
- เก็บ Exhausted Status เดิม
- Equipment ที่ยัง Compatible คงอยู่ (สูงสุด 2 ช่อง)
- Equipment ที่ไม่ Compatible ถูกส่งไป Discard
- การเปลี่ยน Definition ต้องไม่สร้าง Instance ID ใหม่

## 3.2 Progression: Match-Based — LOCKED
- ทุก Match เริ่มจาก Card Definition / Deck Definition ต้นแบบ
- ไม่มี Stage, XP หรือ Stat Progression ที่สะสมข้าม Match
- Evolution / Modification / Fusion ที่เกิดใน Match เป็นสถานะเฉพาะ Match
- เมื่อ Match จบ ให้ Reset Match State
- Cosmetic, Collection และ Achievement ทำได้ แต่ห้ามเพิ่มความได้เปรียบใน Ranked

## 3.3 หลักการ Data Model — LOCKED
แยกอย่างน้อย:
- Card Definitions
- Evolution Recipes
- Fusion Recipes
- Card Instances
- Match States
- Match Events

Card Definition เป็นข้อมูลต้นแบบที่ไม่เปลี่ยนตามการเล่น ส่วน Card Instance เป็นตัวแทนการ์ดแต่ละใบใน Match

---

# 4. Core Rules V1.1 — 1v1 Accessible TCG Baseline (12+)

> สถานะ: Design Baseline V1.1 (ปรับให้เข้าถึงง่ายตั้งแต่เด็กมัธยมขึ้นไป) — ยังไม่ถือว่าผ่าน Playtest หรือ Balance Validation

## 4.1 Match Setup
- ผู้เล่น: **2 คน (1v1 เท่านั้น)**
- Player HP: **20**
- Deck: **30 ใบ**
- Initial Hand: **5 ใบ**
- Maximum copies: **3 ใบต่อ Card ID**
- Battlefield: **สูงสุด 3 Units ต่อผู้เล่น**
- Equipment Slots: **สูงสุด 2 Slots ต่อ Unit**
- Resource: **SPARK**
- ผู้เล่นคนแรกไม่จั่วการ์ดใน Start Phase ของเทิร์นแรก
- Mulligan: 1 ครั้ง เลือกการ์ดในมือจำนวนใดก็ได้คืน Deck แล้วสับ จากนั้นจั่วจำนวนเท่าเดิม

## 4.2 SPARK
- เริ่มเกมที่ **1/1 SPARK**
- ทุก Start Phase เพิ่ม Maximum SPARK ทีละ 1 จนถึง **8**
- เติม SPARK ให้เต็มในทุก Start Phase
- SPARK ที่เหลือไม่สะสมข้ามเทิร์น
- Cost สูงสุดที่จ่ายได้ตามระบบปกติคือ 8
- Cost Reduction ต้องไม่ทำให้ Cost ต่ำกว่า 1 เว้นแต่มี Rule Exception ที่ผ่านการอนุมัติ

## 4.3 Zones
- Deck
- Hand
- Unit Zone (สูงสุด 3 ช่องต่อผู้เล่น)
- Equipment Zone (สูงสุด 2 ช่องต่อ Unit)
- Field Zone (สูงสุด 1 ใบต่อผู้เล่น)
- Discard Pile
- Banished Zone

## 4.4 Card Types
- **Unit:** ตัวละครสิ่งของที่ลงสู้บนสนาม (มีค่า ATK และ HP)
- **Equipment:** อุปกรณ์เสริมที่ติดตั้งให้ Unit (เพิ่มพลังหรือมอบ Keyword)
- **Action:** การ์ดคำสั่งใช้แล้วทิ้ง (เช่น จั่วการ์ด, ค้นหาการ์ด, ฟื้นฟู HP)
- **Field:** การ์ดสภาพแวดล้อมที่ส่งผลทั้งสนาม (ฝั่งละ 1 ใบ)

## 4.5 Turn Structure (3 ขั้นตอนหลักต่อเทิร์น)
1. **Start Phase (จั่ว & เติมพลัง):** ปลด Exhausted ทั้งหมด, เพิ่ม Max SPARK +1 และเติมจนเต็ม, จั่วการ์ด 1 ใบ (คนเริ่มก่อนข้ามการจั่วในเทิร์นแรก)
2. **Main Phase (เล่นการ์ด & พัฒนาร่าง):** ลง Unit, ติด Equipment, ใช้การ์ด Action/Field, ใช้ Boost และทำ **Evolution / Fusion** ได้ในเฟสเดียว
3. **Battle & End Phase (โจมตี & จบเทิร์น):** สั่ง Unit ที่ Ready โจมตี จากนั้นจบผล "จนจบเทิร์น" และส่งเทิร์นให้คู่แข่ง

## 4.6 Summoning
- ต้องมี Unit Slot ว่าง (ไม่เกิน 3 ตัวต่อฝั่ง)
- จ่าย Cost SPARK
- Unit ใหม่เข้าสนามแบบ **Exhausted** (โจมตีทันทีไม่ได้ในเทิร์นที่ลง)
- ยกเว้น Unit ที่มี **Haste** หรือ Effect ที่ระบุให้พร้อมใช้งานทันที
- Unit ที่ Exhausted ไม่สามารถโจมตีได้

## 4.7 Combat Stats (ATK & HP)
- **ATK:** พลังโจมตี
- **HP:** พลังชีวิต (ตัดค่า DEF ออกเพื่อลดการทดเลขซ้ำซ้อน)

Damage Formula:
`Damage = Attacker ATK` (หักลบออกจาก Current HP ของเป้าหมายโดยตรง)

- **Unit-vs-Unit:** ทั้งสองฝ่ายสร้าง Damage เท่ากับค่า ATK ของตนใส่กัน **พร้อมกัน**
- **Direct Attack:** โจมตีเข้า Player HP ได้โดยตรงเมื่อฝ่ายตรงข้ามไม่มี Unit บนสนาม (หรือไม่มี Guard ขวางตามเงื่อนไข)
- **Piercing:** หากดาเมจที่ทำเกิน HP ที่เหลือของ Unit เป้าหมาย ดาเมจส่วนเกินจะพุ่งเข้า Player HP ของฝ่ายตรงข้ามทันที
- Unit ที่โจมตีจะติดสถานะ Exhausted จนถึง Start Phase ถัดไป
- Unit ที่ `HP <= 0` ถูกทำลายลง Discard Pile พร้อม Equipment ที่ติดอยู่

## 4.8 Win Conditions
- Player HP <= 0: แพ้ทันที
- Fatigue: เมื่อต้องจั่วการ์ดแต่ Deck ว่าง เสีย Player HP 1 หน่วยครั้งแรก และเพิ่มทีละ 1 ในครั้งถัดไป (1, 2, 3...)
- หาก Player ทั้งคู่ HP <= 0 พร้อมกัน: เสมอ (Draw)

## 4.9 Evolution System (พัฒนาร่าง)
- **Recipe-based:** พัฒนาร่างตามสูตรที่กำหนดใน Main Phase
- Target Card Definition ใหม่แทนที่การ์ดเดิมบนสนาม
- **คง Instance ID เดิม** และเก็บ Evolution History
- **ได้ HP เต็มตามค่า Max HP ของร่างใหม่ทันที** (ล้าง Damage สะสมเดิมออก)
- **คงสถานะ Exhausted เดิม** (ถ้ายังไม่โจมตี ร่างใหม่โจมตีต่อได้ทันที; ถ้าโจมตีไปแล้ว ร่างใหม่จะยัง Exhausted)
- Equipment ที่ Compatible คงอยู่; Equipment ที่ไม่ Compatible ส่งลง Discard
- Stage:
  - Stage 0: Base
  - Stage 1: Modified
  - Stage 2: Advanced / Fusion
  - Stage 3+: Master / Legendary
- Generic Cost Formula: `EvolutionCost = BaseCost + Current Stage` (Recipe สามารถกำหนด `cost_override` ได้)

## 4.10 Attachment / Equipment
- **สูงสุด 2 Equipment Slots ต่อ Unit**
- Equipment ใช้ 1 Slot ต่อใบ (หรือ 2 Slots สำหรับอุปกรณ์ขนาดใหญ่)
- Compatibility ตรวจจาก Traits หรือเงื่อนไขที่ระบุบนการ์ด
- Ability / Keyword ซ้ำกันไม่ Stack โดยค่าเริ่มต้น เว้นแต่การ์ดระบุ

## 4.11 Fusion (รวมร่าง)
- **Recipe-based:** รวม Unit 2 ตัวบนสนามของผู้เล่นคนเดียวกันใน Main Phase
- Parent Units ทั้ง 2 ตัวถูก Consume ส่งลง Discard (รวมถึง Equipment ที่ติดอยู่)
- สร้าง Fusion Unit ใบใหม่พร้อม Instance ID ใหม่ และบันทึก Parent Instance IDs
- **ได้รับ HP เต็มตามค่า Max HP ของการ์ด Fusion ทันที**
- เข้าสนามแบบ **Exhausted** (ยกเว้นมี Haste)
- Keyword Inheritance: รับเฉพาะ Keyword ที่สูตร Recipe ระบุอนุญาตและมีอยู่บน Parent จริง (สูงสุด 2 Keywords)

## 4.12 Power Budget — Initial Guideline (ATK + HP)
ใช้ `ATK + HP` เป็นเกณฑ์ตั้งต้นก่อนปรับตามความแรงของ Keyword:

| Cost | Total Stats Guideline (ATK + HP) |
|---:|---:|
| 1 | 4–6 |
| 2 | 6–8 |
| 3 | 8–10 |
| 4 | 11–13 |
| 5 | 13–15 |

## 4.13 Exploit Prevention
- SPARK Cap
- Recipe Cost Validation
- Stacking Restrictions
- Fusion Damage Transfer
- Summon Restrictions
- Loop Detection
- Inheritance Limits
- Exhaustion Preservation
- Maximum Slots
- Evolution Graph Validation
- Server-authoritative validation

---

# 5. Keyword & Effect Engine Specification V1.0

> สถานะ: Specification Draft / Initial Design — ยังไม่ผ่าน Implementation Test หรือ Playtest

## 5.1 Engine Goals
- Keyword มีความหมายแน่นอนและใช้กฎกลาง
- Effect ทำงานตาม Timing
- Condition ต้องผ่านก่อนทำงาน
- ป้องกัน Duplicate Trigger
- รองรับ Keyword / Effect ใหม่โดยไม่รื้อระบบหลัก
- Server เป็นผู้ตัดสิน
- ทุกการเปลี่ยนแปลงบันทึก Match Event Log

## 5.2 Keyword Groups (6 Core Keywords — V1.1)
คัดเฉพาะ 6 คำหลักที่เข้าใจความหมายได้ทันทีสำหรับผู้เล่นอายุ 12+ (ตัด Reinforce, Unstable, Modular, Ancient, Recycle ออกเป็น Ability Text ธรรมดาหากจำเป็น):
- **Combat (4 คำ):** `Haste`, `Guard`, `Flying`, `Piercing`
- **Active Stat (1 คำ):** `Boost` (ปรับชื่อจาก Overclock ให้เข้าใจง่ายขึ้น)
- **Utility (1 หมวด):** `Draw / Search`

## 5.3 Keyword Definitions

### HASTE — โจมตีได้ทันที
Unit สามารถโจมตีในเทิร์นที่ลงสนามหรือสร้างขึ้นได้ทันที (เข้ามาแบบ Ready)
- ไม่ยกเลิก Exhausted จาก Effect อื่น และไม่ให้โจมตีเกิน 1 ครั้งต่อเทิร์น

### GUARD — โล่กำบัง
หากฝ่ายป้องกันมี Unit ที่มี Guard และอยู่ในสถานะ Ready ผู้โจมตีต้องเลือกตีตัวที่มี Guard ก่อนเสมอ
- หากมี Guard หลายตัว ผู้โจมตีเลือกตีตัวใดก็ได้
- หาก Guard ทุกตัว Exhausted จะไม่บังคับเป้าหมาย

### FLYING — บินได้
Unit ที่ไม่มี Flying ไม่สามารถเลือกโจมตี Unit ที่มี Flying ได้
- Unit ที่มี Flying โจมตีได้ทั้งตัวบนพื้นและตัวบิน
- Guard ที่มี Flying บังคับเป้าหมายเฉพาะตัวโจมตีที่มี Flying

### PIERCING — เจาะทะลุ
เมื่อโจมตี Unit แล้วค่า ATK มากกว่า HP ที่เหลือของเป้าหมาย ดาเมจส่วนเกินจะทะลุเข้า Player HP ของฝ่ายตรงข้ามทันที
- ใช้กับการโจมตีปกติ (Combat Damage) เท่านั้น

### BOOST — เร่งพลัง (ปรับจาก Overclock)
ใน Main Phase ของเรา จ่าย **1 SPARK** เพื่อให้ Unit (ที่ยังไม่ Exhausted) ได้ **+2 ATK จนจบเทิร์น**
- ใช้ได้ 1 ครั้งต่อ Unit ต่อเทิร์น (ไม่ Stack)

### DRAW N / SEARCH — จั่วการ์ด / ค้นหาการ์ด
- **Draw N:** จั่วการ์ดจาก Deck ทีละใบตามจำนวน N (ถ้า Deck หมดคิด Fatigue)
- **Search:** ค้นหาการ์ดที่ตรงเงื่อนไข 1 ใบจาก Deck เปิดเผยให้ทั้งสองฝ่ายเห็น นำขึ้นมือ แล้วสับ Deck

## 5.4 Trigger Events
- ON_GAME_START
- ON_TURN_START
- ON_DRAW
- ON_SUMMON
- ON_ENTER_FIELD
- ON_ATTACK_DECLARE
- ON_COMBAT_START
- ON_DAMAGE
- ON_DESTROY
- ON_EVOLVE
- ON_FUSION
- ON_EQUIP
- ON_EQUIPMENT_LOST
- ON_CARD_DISCARD
- ON_TURN_END

หมายเหตุ: รายการนี้มี 15 Event IDs ตามที่ระบุจริงในรายการด้านบน

## 5.5 Effect Types
- MODIFY_STAT
- DEAL_DAMAGE
- HEAL
- DRAW_CARD
- SEARCH_CARD
- RECYCLE_CARD
- SUMMON_UNIT
- DESTROY_UNIT
- EXHAUST_UNIT
- READY_UNIT
- ADD_KEYWORD
- REMOVE_KEYWORD
- ATTACH_EQUIPMENT
- MOVE_ZONE
- MODIFY_COST
- EVOLVE_UNIT
- FUSION_UNIT

หมายเหตุ: รายการ Effect Types มี 17 ประเภท

## 5.6 Effect Pipeline
1. Trigger Detection
2. Condition Validation
3. Effect Queue
4. Effect Resolution
5. State-Based Check
6. ตรวจ Trigger ที่เกิดใหม่และทำซ้ำจนคิวว่าง

## 5.7 Trigger / Resolution Priority
- คำสั่งหลักที่ผู้เล่นประกาศ
- Validate และจ่าย Cost
- สร้าง Event
- ตรวจ Trigger
- ผู้เล่นผู้ควบคุมเทิร์นเรียง Trigger ของตนก่อน
- ผู้เล่นอีกฝ่ายเรียง Trigger ของตน
- Resolve ตามคิว
- State-Based Actions
- ตรวจ Trigger ใหม่
- คืนสิทธิ์ผู้เล่นเมื่อคิวว่าง

Trigger ที่เกิดระหว่าง Resolution เข้าคิวใหม่หลัง Effect ปัจจุบันจบ ไม่แทรกกลาง Effect ปัจจุบัน

## 5.8 Response Window
- เปิดเฉพาะ Action / Effect ที่กำหนดให้ตอบโต้ได้
- ฝ่ายตรงข้ามมีสิทธิ์ตอบโต้ก่อน Resolution
- Triggered Effect ไม่เปิด Response Window โดยอัตโนมัติ
- ระหว่าง Resolution ห้ามแทรกคำสั่งทั่วไป
- Counter / Interrupt ในอนาคตต้องระบุ Timing ชัดเจน

## 5.9 Targets
- SELF
- OWN_UNIT
- ENEMY_UNIT
- ANY_UNIT
- OWN_PLAYER
- ENEMY_PLAYER
- ANY_PLAYER
- OWN_DISCARD
- OWN_DECK
- ANY_EQUIPMENT

## 5.10 Conditions
- HAS_KEYWORD
- HAS_EQUIPMENT
- STAGE_EQUALS
- STAGE_GREATER_THAN
- HP_BELOW
- DAMAGE_RECEIVED
- ZONE_EQUALS
- UNIT_COUNT
- HAND_COUNT
- DISCARD_COUNT
- TURN_NUMBER
- OWNER_EQUALS
- AND / OR / NOT

## 5.11 Duration
- INSTANT
- UNTIL_END_OF_TURN
- UNTIL_START_OF_NEXT_TURN
- WHILE_SOURCE_ACTIVE
- PERMANENT
- UNTIL_REMOVED

## 5.12 Stacking
- Stat Bonus จากแหล่งต่างกัน Stack ได้
- Effect จากแหล่งเดียวกันไม่ Stack โดยค่าเริ่มต้น
- Keyword เดียวกันไม่ซ้ำ เว้นแต่ระบุ
- Reinforce ไม่ Stack จำนวนครั้งป้องกัน
- Overclock ใช้ได้ 1 ครั้งต่อ Unit ต่อ Turn
- Damage Reduction รวมตามแหล่ง แต่ Damage ต่ำสุด 0
- Cost Reduction รวมได้ แต่มี Cost Floor
- Duration แยกติดตามตาม Effect Source

## 5.13 Evolution / Fusion Interaction
Evolution:
- คง Instance ID
- Definition เปลี่ยน
- Keyword จาก Definition เก่าไม่ติดตามอัตโนมัติ
- Equipment ที่ Compatible ยังคงทำงาน
- Keyword จาก Equipment ยังมีผลตราบใดที่ Equipment ยังอยู่และไม่ถูกปิด

Fusion:
- สร้าง Instance ID ใหม่
- Parent Instance IDs ถูกบันทึก
- Keyword จาก Parent ไม่สืบทอดอัตโนมัติ
- Recipe ต้องกำหนด Inheritance
- Equipment ไม่โอนอัตโนมัติ

## 5.14 Combat Resolution
1. Attack Declaration
2. ตรวจ Haste / Exhausted / Flying / Guard
3. Attack Triggers
4. Response Window หากเปิดได้
5. Combat Calculation
6. Damage Modification (เช่น Reinforce)
7. Apply Damage พร้อมกัน
8. Piercing คำนวณจาก Damage ที่เกิดขึ้นจริงหลังป้องกัน เทียบกับ HP ที่เหลือก่อน Apply
9. Post Combat Triggers เช่น Unstable
10. State-Based Check / Destroy / Win Check

**ตัวอย่าง Piercing:** Attacker ATK 7, Target DEF 2, Target HP เหลือ 3 → Base Damage 5; หากไม่มีการป้องกัน Damage ส่วนเกิน 2 ส่งไป Player. หาก Reinforce ป้องกัน 2, Actual Damage 3 จึงไม่มี Damage ส่วนเกิน

**Open issue สำคัญ:** ต้องเขียนกฎการคำนวณ Combat แบบเป็นสมการเดียวให้ชัด โดยเฉพาะลำดับ HP ก่อน/หลัง Apply, Simultaneous Damage, Reinforce, Piercing, Damage Prevention และกรณี Unit ถูกทำลายระหว่างการคำนวณ

## 5.15 Safety Limits
ค่าเริ่มต้นที่เสนอ:
- Effect Resolution สูงสุด 100 รายการต่อการกระทำหลัก
- Trigger Chain สูงสุด 20 ชั้นต่อ Chain
- Once Per Turn ต้องบันทึกใน Match State
- Idempotency ป้องกันคำสั่งจ่าย Cost ซ้ำ
- เมื่อเกิน Limit ให้หยุด Resolution และเข้าสู่ Error State ที่ตรวจสอบได้

ตัวเลขเหล่านี้เป็น Technical Safety Limits ที่ยังปรับได้หลังทดสอบ

## 5.16 Technical Modules
- KeywordRegistry
- TriggerEngine
- ConditionEvaluator
- TargetResolver
- EffectQueue
- EffectResolver
- CombatEngine
- StateBasedActionEngine
- EvolutionEngine
- FusionEngine
- MatchEventLogger

## 5.17 Acceptance Tests
1. Haste โจมตีได้ในเทิร์นที่ Summon
2. Haste ไม่ลบ Exhausted
3. Overclock จ่าย 1 SPARK แล้วได้ +2 ATK
4. Overclock ใช้ซ้ำใน Turn เดียวกันไม่ได้
5. Reinforce ลด Damage ครั้งแรก 2
6. Piercing ส่ง Damage ส่วนเกินไป Player
7. Guard บังคับการเลือกเป้าหมายเมื่อ Ready
8. Flying ป้องกันการถูกโจมตีจาก Non-Flying
9. Draw จั่วตามจำนวน
10. Search ค้นหาและสับ Deck
11. Recycle นำการ์ดจาก Discard กลับมือ
12. Modular เพิ่ม Slot
13. Ancient ลด Evolution Cost แต่ไม่ต่ำกว่า 1
14. Unstable ทำ Damage 1 หลัง Combat
15. Trigger Order ถูกต้อง
16. Target ที่หายไปทำให้ Effect ล้มเหลวตาม Policy
17. Evolution ไม่สืบทอด Keyword เดิมอัตโนมัติ
18. Fusion สืบทอดตาม Recipe เท่านั้น
19. Loop Protection ทำงาน
20. Match Reset ล้าง Temporary State


## 5.18 Locked Keyword Interpretations — V1.1 Accessible Baseline

หัวข้อนี้ล็อกความหมายของ **6 Core Keywords** เพื่อให้ Card Text, Engine และ Test ตรงกัน 100%

- **HASTE:** เข้าสนามแบบ Ready ในเทิร์นที่ลงสนาม โจมตีได้ 1 ครั้งแล้วติด Exhausted ตามปกติ
- **GUARD:** บังคับให้ผู้โจมตีเลือกตีตัวที่มี Guard และ Ready ก่อนเสมอ (ยกเว้น Guard ที่บินอยู่ซึ่งบังคับเฉพาะผู้โจมตีที่บินได้)
- **FLYING:** ตัวที่ไม่มี Flying โจมตีตัวที่มี Flying ไม่ได้ แต่ตัวที่มี Flying โจมตีได้ทุกเป้าหมาย
- **PIERCING:** `Excess Damage = max(0, Attacker ATK - Defender Current HP)` ส่งเข้า Player HP ของฝ่ายป้องกันทันที
- **BOOST:** จ่าย 1 SPARK ใน Main Phase ให้ Unit ที่ Ready รับ +2 ATK จนจบเทิร์น (1 ครั้ง/ตัว/เทิร์น)
- **DRAW N / SEARCH:** Draw จั่วทีละใบตามจำนวน; Search เปิดเผยการ์ดจาก Deck ขึ้นมือแล้วสับ Deck เสมอ (หากต้องการนำการ์ดจาก Discard กลับขึ้นมือ ให้เขียนอธิบายตรงตัวบนการ์ดแทนการใช้ Keyword แยก)

---

# 6. Card Design & Foundation Set

## 6.1 Foundation Set (เป้าหมาย 45–60 ใบ)
- ออกแบบรองรับ Deck 30 ใบ แบ่งอย่างน้อย 3 สายการเล่น (Aggro ความเร็ว, Guard ตั้งรับ, Fusion รวมร่าง)
- Rarity (Normal / Rare / Super Rare) ใช้สำหรับระบบสะสมและ Cosmetic เท่านั้น ไม่ทำให้การ์ดเก่งกว่าเกณฑ์ Power Budget

## 6.2 Card Data Contract
ทุก Card Definition ประกอบด้วย: `card_id`, `name`, `card_type`, `rarity`, `stage`, `cost`, `atk`, `hp` (ตัด `def` ออก), `traits`, `keywords`, `effects`, `slot_cost`, `compatibility`, `evolution_recipe_refs`, `fusion_recipe_refs`, `flavor_text`, `definition_version`, `ruleset_compatibility` (`1.1.0`)

## 6.5 Recipe Library V1.1 — LOCKED DESIGN BASELINE

### 6.5.1 Recipe Policy (V1.1)
- **Evolution:** เปลี่ยนการ์ดบนสนามเป็นร่างใหม่ คง Instance ID เดิม, คงสถานะ Exhausted เดิม และ **ได้รับ HP เต็มตามค่า Max HP ของร่างใหม่ทันที**
- **Fusion:** ใช้ Unit 2 ตัวบนสนามของเจ้าของเดียวกัน ส่งทั้งคู่ (และ Equipment ที่ติดอยู่) ลง Discard แล้วสร้างการ์ด Fusion ใบใหม่พร้อม **HP เต็มตามการ์ดใบใหม่ทันที**

### 6.5.2 Evolution Recipes (EV-001 ถึง EV-008)

| Recipe ID | From → To | Requirements | Cost | Equipment |
|---|---|---|---:|---|
| EV-001 | `U001_RUBBER_DUCKLING` → `U101_TURBO_BATH_DUCK` | Stage 0; Trait `TOY` | 2 | Keep Compatible (Max 2) |
| EV-002 | `U002_TIN_CAN_GUARDIAN` → `U102_STEEL_CAN_BASTION` | Stage 0; Trait `METAL` | 2 | Keep Compatible (Max 2) |
| EV-003 | `U003_PAPER_GLIDER` → `U103_PAPER_JET` | Stage 0; Trait `PAPER` | 2 | Keep Compatible (Max 2) |
| EV-004 | `U004_POCKET_FLASHLIGHT` → `U104_SOLAR_SEARCHLIGHT` | Stage 0; Trait `LIGHT_SOURCE` | 2 | Keep Compatible (Max 2) |
| EV-005 | `U005_MINI_SKATEBOARD` → `U105_ROCKET_SKATEBOARD` | Stage 0; Trait `RIDEABLE` | 3 | Keep Compatible (Max 2) |
| EV-006 | `U006_THERMOS_GOLEM` → `U106_PRESSURE_TANK_GOLEM` | Stage 0; Trait `CONTAINER` | 3 | Keep Compatible (Max 2) |
| EV-007 | `U007_BATTERY_BUDDY` → `U107_PORTABLE_POWER_HUB` | Stage 0; Trait `POWER` | 2 | Keep Compatible (Max 2) |
| EV-008 | `U008_WINDUP_ROBOT` → `U108_OVERWOUND_CLOCKWORK` | Stage 0; Trait `CLOCKWORK` | 2 | Keep Compatible (Max 2) |

### 6.5.3 Fusion Recipes (FU-001 ถึง FU-003)

| Recipe ID | Required Parents (2 Units) | Result | Cost | Inheritance |
|---|---|---|---:|---|
| FU-001 | `U001_RUBBER_DUCKLING` + `U003_PAPER_GLIDER` | `U201_AMPHIBIOUS_GLIDER` | 3 | None (มี Flying บนการ์ดอยู่แล้ว) |
| FU-002 | `U002_TIN_CAN_GUARDIAN` + `U006_THERMOS_GOLEM` | `U202_FORTRESS_KETTLE` | 4 | รับ `Guard` หาก Parent มี Guard |
| FU-003 | `U005_MINI_SKATEBOARD` + `U007_BATTERY_BUDDY` | `U203_ELECTRIC_RIDE` | 4 | รับ `Boost` หาก Parent มี Boost |

### 6.5.4 Sample Card Library V1.1 — 25 Cards (ATK / HP Only)

**Unit Definitions (19 ใบ)**

| Card ID | Name | Stage | Cost | ATK / HP | Keyword & Trait |
|---|---|---:|---:|---:|---|
| U001 | Rubber Duckling | 0 | 1 | 2 / 3 | `Haste` • TOY |
| U002 | Tin Can Guardian | 0 | 1 | 1 / 4 | `Guard` • METAL |
| U003 | Paper Glider | 0 | 1 | 2 / 2 | `Flying` • PAPER |
| U004 | Pocket Flashlight | 0 | 2 | 2 / 4 | Ability: ลดค่า Evo ตัวเอง 1 • LIGHT_SOURCE |
| U005 | Mini Skateboard | 0 | 2 | 3 / 3 | `Boost` • RIDEABLE |
| U006 | Thermos Golem | 0 | 2 | 2 / 5 | `Guard` • CONTAINER, METAL |
| U007 | Battery Buddy | 0 | 2 | 2 / 4 | Ability: ติด Equipment ได้ทุกสาย • POWER |
| U008 | Wind-up Robot | 0 | 2 | 3 / 3 | `Haste` • CLOCKWORK |
| U101 | Turbo Bath Duck | 1 | Evo 2 | 4 / 5 | `Haste`, `Piercing` • TOY |
| U102 | Steel Can Bastion | 1 | Evo 2 | 2 / 7 | `Guard` • METAL |
| U103 | Paper Jet | 1 | Evo 2 | 4 / 4 | `Flying`, `Piercing` • PAPER |
| U104 | Solar Searchlight | 1 | Evo 2 | 3 / 6 | `Guard` • LIGHT_SOURCE |
| U105 | Rocket Skateboard | 1 | Evo 3 | 5 / 5 | `Boost`, `Haste` • RIDEABLE |
| U106 | Pressure Tank Golem | 1 | Evo 3 | 3 / 8 | `Guard` • CONTAINER, METAL |
| U107 | Portable Power Hub | 1 | Evo 2 | 3 / 6 | Ability: ติด Equipment ได้ทุกสาย • POWER |
| U108 | Overwound Clockwork | 1 | Evo 2 | 4 / 5 | `Haste`, `Piercing` • CLOCKWORK |
| U201 | Amphibious Glider | 2 | Fus 3 | 6 / 7 | `Flying` • FUSION |
| U202 | Fortress Kettle | 2 | Fus 4 | 4 / 9 | `Guard` (Conditional) • FUSION |
| U203 | Electric Ride | 2 | Fus 4 | 6 / 8 | `Boost` (Conditional) • FUSION |

**Action & Equipment Definitions (6 ใบ)**

| Card ID | Name | Type | Cost | Effect |
|---|---|---|---:|---|
| A001 | Quick Doodle | Action | 1 | `Draw 2` (จั่วการ์ด 2 ใบ) |
| A002 | Lost & Found | Action | 1 | `Search` ค้นหา Equipment 1 ใบจาก Deck ขึ้นมือ |
| A003 | Scrap Return | Action | 1 | นำ Equipment 1 ใบจาก Discard กลับขึ้นมือ |
| E001 | Clip-on Propeller | Equipment | 1 | ติดกับ `TOY` หรือ `PAPER` (1 Slot): มอบ `Flying` |
| E002 | Reinforced Lid | Equipment | 1 | ติดกับ `CONTAINER` หรือ `METAL` (1 Slot): เพิ่ม **+2 HP** |
| E003 | Power Charger | Equipment | 1 | ติดกับทุก Unit (1 Slot): เพิ่ม **+1 ATK** |

## 6.6 Core Scenario Tests — V1.1 Expected Results

| Test ID | Setup / Action | Expected Result |
|---|---|---|
| T-001 Haste | ลง U001 ในเทิร์นนี้แล้วสั่งโจมตี | โจมตีได้ทันที 1 ครั้ง แล้วติด Exhausted |
| T-002 Guard | ฝ่ายป้องกันมี U002 Ready อยู่บนสนาม | ผู้โจมตีต้องเลือกตี U002 ก่อน |
| T-003 Flying | U001 (ไม่บิน) พยายามตี U003 (Flying) | Reject; โจมตีตัวบินไม่ได้ |
| T-004 Piercing | U101 (ATK 4) ตีใส่ Unit ที่มี HP เหลือ 2 | Unit พังลง และดาเมจเกิน **2** ทะลุเข้า Player HP ทันที |
| T-005 Boost | U005 จ่าย 1 SPARK ใช้ Boost | ATK เพิ่มจาก 3 เป็น 5 จนจบเทิร์น (ใช้ได้ 1 ครั้ง/เทิร์น) |
| T-006 Evolution HP | U001 เหลือ HP 1 แล้วทำ EV-001 เป็น U101 | U101 ได้ HP เต็ม **5** ทันที และคงสถานะ Exhausted เดิม |
| T-007 Fusion HP | U001 (HP 1) + U003 (HP 1) รวมร่างเป็น U201 | U201 เกิดใหม่พร้อม HP เต็ม **7** และเข้าสนามแบบ Exhausted |

# 8. Game Design Workplan (ลำดับงานออกแบบ — แผนพัฒนาระบบอยู่ใน Blueprint §9)

## 8.1 ลำดับการออกแบบเกม
ลำดับที่แนะนำสำหรับ TCG:
1. ตรวจและล็อก Core Rules V1.0 โดยปิด Open Issues
2. ปิด Keyword & Effect Engine V1.0 และทำ Test Scenarios
3. **ล็อก Evolution / Fusion Recipe Library V1.0 Design Baseline** (เพิ่มแล้วใน Section 6.5)
4. **ตรวจ Keyword ด้วย Sample Card Set และ Scenario Tests** (เพิ่มแล้วใน Section 5.18 และ 6.6; ยังต้องแปลงเป็น Automated Tests)
5. ปิด Material / Equipment / Field / Action rules ให้ครบ
6. ทำ Card Data Schema และ Validation
7. ออกแบบ Foundation Set 60 Cards
8. ตรวจ Archetype และ Deck Construction
9. ทำ Power Budget / Balance Spreadsheet
10. สร้าง Automated Match Simulation
11. Playtest หลาย Archetype และเก็บข้อมูล
12. ปรับ Balance และออก Ruleset Version
13. จึงล็อก Card Set สำหรับ MVP

## 8.2 Recipe Library — งานถัดไปที่ควรเริ่ม
### Evolution Recipe
แต่ละ Recipe ต้องมี:
- recipe_id
- source_definition_id หรือ source filter
- target_definition_id
- required_stage
- required_traits / elements
- required_materials
- required_equipment (ถ้ามี)
- base_cost / cost_override
- compatibility policy
- damage policy
- exhaustion policy
- inherited keyword / effect policy
- validation constraints
- recipe_version

### Fusion Recipe
แต่ละ Recipe ต้องมี:
- recipe_id
- required_unit_count
- allowed_categories / definitions
- minimum_stage
- required_traits / elements
- required_attachments
- required_materials
- base_cost / material_cost
- result_definition_id
- damage_transfer_policy
- equipment_transfer_policy
- inherited_keyword_ids (สูงสุด 2 ตาม Baseline)
- inherited_passive_ability (สูงสุด 1 ตาม Baseline)
- parent_history policy
- validation constraints
- recipe_version

## 8.3 Engine Implementation Order
1. Domain Types และ State Model
2. Card / Keyword Registry
3. Command Validation
4. Condition Evaluator
5. Target Resolver
6. Trigger Engine
7. Effect Queue / Resolver
8. State-Based Actions
9. Combat Engine
10. Evolution Engine
11. Fusion Engine
12. Match Event Log / Replay
13. Property-based / Scenario Tests
14. API Adapter / Persistence

## 8.4 Testing Strategy
- Unit Tests ของทุก Keyword
- Unit Tests ของ Effect Types
- Trigger ordering tests
- Target invalidation tests
- Damage / simultaneous combat tests
- Evolution preserve-instance tests
- Fusion new-instance / parent-history tests
- Equipment compatibility tests
- Stacking / Duration tests
- Infinite loop / recursion tests
- Deterministic replay tests
- Server security / RLS tests
- Integration tests สำหรับ Command → Resolve → Commit
- E2E tests สำหรับ Match flow
- Load tests สำหรับ Concurrent Matches

## 8.5 Balance / Simulation Metrics
ควรเก็บ:
- Win Rate ตาม Archetype
- Win Rate ตาม Card ID
- Card Pick Rate
- Average Match Duration
- Average Turn / SPARK spent
- Evolution Rate / Stage reached
- Fusion Rate / Fusion success
- Equipment usage rate
- Dead card rate
- Matchup matrix
- Combo frequency
- Loop / Lock / Error frequency

ห้าม Balance จากความรู้สึกอย่างเดียว ต้องดู Playtest Data และตรวจบริบทของ Deck / Matchup ด้วย

---

# 10. Versioning & Change Control

- V1.0: Core Rules Baseline
- V1.0.1: Bug Fix / Clarification ที่ไม่เปลี่ยนระบบหลัก
- V1.1: Balance Update / Keyword Tuning
- V1.2: เพิ่ม Keyword / Subsystem
- V2.0: เปลี่ยนโครงสร้าง Core Rules / Engine

ทุก Change Request ต้องระบุ:
1. Old Rule
2. New Rule
3. Reason
4. Affected Cards / Recipes
5. Engine Impact
6. Data Migration Impact
7. Backward Compatibility
8. Tests Required
9. Balance Impact
10. Rollback Plan

ห้ามแก้กติกาโดยไม่อัปเดตเอกสาร, Test และ Version

---

# 11. Open Issues / ต้องตัดสินใจก่อนถือว่า Specification สมบูรณ์

รายการเหล่านี้ยังไม่ควรถือว่าล็อก:
1. กติกา Material และ Material Zone
2. วิธีเล่น Action และ Response Window แบบละเอียด
3. Field Card: จำกัด 1 ใบ, การแทนที่, Duration และ Effect
4. Equipment Slot และ Compatibility Matrix ที่ละเอียด
5. HP / Max HP / Damage / Heal interaction
6. Combat timing ที่แน่นอนสำหรับ Simultaneous Damage, Reinforce, Piercing และ Unstable
7. Trigger ordering เมื่อมี Trigger หลายฝ่ายและ Trigger ใหม่เกิดระหว่าง Resolution
8. การยกเลิก Effect / Target หาย / Source ถูกทำลาย
9. Cost Floor และ Cost Reduction stacking
10. Keyword inheritance / Effect inheritance สำหรับแต่ละ Recipe
11. Fusion damage transfer เมื่อ Parent มี Damage ต่างกัน
12. Fusion equipment transfer / slot overflow
13. Evolution graph validation และการป้องกันวนกลับไป Definition เดิม
14. Deck construction restrictions เพิ่มเติม เช่น Card Type ratio / Sideboard (ถ้ามี)
15. Ranked matchmaking / Season / Banlist
16. Rarity และ Ultra/Event distribution ที่แน่นอน
17. Foundation Set 60 ใบและ Archetype ที่ผ่านการทดสอบ
18. Economy / Collection / Crafting / Monetization — ต้องแยกจาก Competitive Power
19. Accessibility / Localization / Animation Performance
20. Legal review ของ Art Assets และ Commercial Usage

---

# Appendix — Change Log

## 2026-11-20 — Recipe Library & Keyword Test Baseline
- Locked design baseline for 8 Evolution Recipes (`EV-001`–`EV-008`).
- Locked design baseline for 3 Fusion Recipes (`FU-001`–`FU-003`).
- Added 14 base Unit / Action / Equipment fixture definitions plus 11 Evolution / Fusion result definitions (25 card definitions total).
- Clarified all 12 Keywords: Haste, Piercing, Guard, Flying, Overclock, Reinforce, Draw, Search, Recycle, Modular, Ancient, Unstable.
- Added 35 deterministic scenario test cases and worked combat calculations.
- Added Recipe validation rules, power-budget review flags, and explicit distinction between manual rule validation and automated/playtest validation.
- No claim of automated test pass or player balance validation is made by this update.

## 2026-11-20 (v1.1) — 1v1 Accessible Ruleset (12+) & Legacy Removal
- Removed all legacy multi-player/shared-deck appendices and references; locked game scope strictly to **1v1 (2 players)**.
- Simplified Core Rules to V1.1 for broader age accessibility (ages 12+): removed DEF stat (ATK/HP only), reduced Player HP to 20 and Deck size to 30 cards, consolidated turn flow into 3 phases (Start, Main, Battle/End), and streamlined keywords to 6 core keywords (`Haste`, `Guard`, `Flying`, `Piercing`, `Boost`, `Draw/Search`).
- Updated Evolution and Fusion to restore full target Max HP upon transformation, and capped Equipment slots at 2 per Unit.
- Updated all 25 sample cards and 11 locked recipes to V1.1 ATK/HP specifications.

## 2026-11-20 — Spec v3.0 consolidation

- รวม Handoff v1.1 เข้าเป็น `aummon_game_spec.md` ไฟล์เดียว; ยกเลิกกติกา 2–4 คน (Rulebook v1) ตามการอนุมัติของเจ้าของ
- เพิ่ม §1 Product & Platform Decisions: 3 โหมดเป็น 1v1, Starter Deck 30 ใบ, Turn timer 90 วินาที (จบเทิร์นอัตโนมัติ)
- ตัดส่วนที่ไม่ใช่กติกาเกม (คำสั่ง AI, สถานะงาน, Architecture — อยู่ใน Blueprint) และ §8.2.1 ที่ล้าสมัย (อ้าง 12 Keywords / KW-001–035 ของ V1.0)
