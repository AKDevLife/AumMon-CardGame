# AumMon — Game Spec v2.1 (Rulebook v1 Locked)

> เอกสารนี้เป็นแหล่งอ้างอิงหลักของ **กติกาเกมและข้อกำหนดผลิตภัณฑ์ AumMon**  
> Architecture, Database, Security, เครื่องมือ และแผนพัฒนาอยู่ใน `aummon_project_blueprint.md`  
> เวอร์ชัน: 2.1 (Rulebook v1) | สถานะ: Core rules และกติกาทั้ง 15 ข้อถูกล็อกเป็น Rulebook v1 แล้ว

## 1. Product Direction

- ประเภทเกม: Multiplayer card battle แบบ Last Survivor
- ผู้เล่น: 2–4 คน
- โหมด: Solo vs Server AI Bots, Pass & Play (เครื่องเดียว), Online Multiplayer (คนละเครื่อง)
- Membership: ต้องมี Account สำหรับเข้าใช้ระบบและเริ่มเล่น
- Bot: ทำงานและตัดสินใจบน Server เท่านั้น
- Business model: เล่นฟรีในช่วงแรก (**Free now, monetization-ready later**)
- หลักความถูกต้อง: Server เป็นผู้ตัดสินสถานะและผลเกม (server-authoritative)

## 2. Core Rules

- Win condition: ผู้เล่นคนสุดท้ายที่ยังมี `HP > 0` เป็นผู้ชนะ (หากไม่มีผู้รอดชีวิตเลย ให้ตัดสินเป็นเสมอ / Draw)
- Setup: ผู้เล่นแต่ละคนเลือกตัวละคร 1 ตัว
- Initial hand: 3 ใบ
- Maximum hand: 5 ใบ
- Shared deck: 40 ใบ ประกอบด้วยการ์ดพื้นฐาน 4 ประเภท

| Card | Core effect |
|---|---|
| `attack` | ทำดาเมจ 1 หน่วยต่อเป้าหมายที่เลือก 1 คน |
| `defense` | สร้างโล่ป้องกันดาเมจได้สูงสุด 1 หน่วยตลอดทั้งรอบนั้น (1-Damage Shield) |
| `support` | เลือกฟื้น HP 1 หน่วย (ไม่เกิน `maxHp`) หรือจั่วการ์ด 1 ใบ (เลือกตอน Select) |
| `chaos` | สลับเป้าหมาย (Redirect) หรือสร้างความปั่นป่วน/ดาเมจหมู่ (AoE/Disrupt) ตามชนิด Effect ของการ์ด |

### Round flow

1. **Draw & Start** — จั่ว 1 ใบ (หากมือครบ 5 ใบแล้วให้ข้ามการจั่ว; ถ้า Deck หมดให้สับ Discard กลับเข้า Deck) จากนั้นเรียก `onTurnStart`
2. **Select** — ผู้เล่นที่ยังมีชีวิตแต่ละคนเลือกการ์ด 1 ใบแบบคว่ำหน้า พร้อมระบุเป้าหมาย (`target`) หรือตัวเลือก (`choice`) ทันที
3. **Resolve** — เปิดการ์ดทั้งหมดพร้อมกัน, เรียงลำดับตาม `speed` จากมากไปน้อย (เท่ากันใช้ `seat` น้อยกว่าขึ้นก่อน), ประมวลผลทีละคนตามลำดับ: `onAttack` → `onBeforeDamaged` → คำนวณ Defense Shield & ลด HP → `onAfterDamaged` (ผู้เล่นที่ `HP <= 0` ระหว่าง Resolve จะถูกคัดออกทันทีและข้าม Action ของตนที่ยังไม่ได้เล่น)
4. **End** — เรียก `onRoundEnd` สำหรับผู้รอดชีวิต (`alive`) เรียงตาม `speed` แล้วตรวจผู้ชนะ

## 3. Character System

ข้อมูลตัวละครต้องแยกจาก Core Game Engine และแต่ละ Skill ต้องผูกกับ Hook หนึ่งในห้าตัวนี้เท่านั้น:

- `onTurnStart`
- `onAttack`
- `onBeforeDamaged`
- `onAfterDamaged`
- `onRoundEnd`

การเพิ่มตัวละครใหม่ให้เพิ่ม Character Definition และ Handler ของ `effectKey` โดยไม่แก้ Core Round Rules

### Starter characters

| ID | ชื่อ | ธาตุ | HP | Speed | Hook | Effect key | คำอธิบาย |
|---|---|---|---:|---:|---|---|---|
| `pyro_pup` | ปิโร่ ลูกหมาไฟ | fire | 3 | 70 | `onAttack` | `BONUS_DMG_FIRST_HIT` | การโจมตีที่เข้าเป้าและไม่ถูกหลบ/ป้องกัน 100% ครั้งแรกในรอบ +1 ดาเมจ |
| `aqua_otter` | อควา นากน้อยสายน้ำ | water | 3 | 60 | `onTurnStart` | `SWAP_CARD_ONCE` | 1 ครั้ง/เกม ในช่วงเริ่มเทิร์น (ก่อน Select) สลับการ์ดบนมือแบบสุ่ม 1 ใบกับผู้เล่นที่ยังรอดชีวิต |
| `breeze_kit` | บรีซ ลูกจิ้งจอกลม | wind | 3 | 90 | `onBeforeDamaged` | `DISCARD_TO_DODGE` | ทิ้งการ์ดแบบสุ่มบนมือ 1 ใบเพื่อหลบดาเมจทั้งหมดจาก Hit นั้น (1 ครั้งต่อ Hit) |
| `terra_tortoise` | เทอร์ร่า เต่าหินจอมอึด | earth | 4 | 40 | `onBeforeDamaged` | `REDUCE_DMG_1` | เริ่ม 4 HP และลดดาเมจที่ได้รับในแต่ละ Hit ลง 1 หน่วย (ต่ำสุด 0) |

## 4. Multiplayer & Information Rules

- **Solo:** หนึ่ง Account เล่นกับ Bot อย่างน้อยหนึ่งตัวตามจำนวนผู้เล่นที่เลือก
- **Pass & Play:** ผู้เล่นหลายที่นั่งใช้เครื่องเดียว มี Privacy Handoff ซ่อนข้อมูลของผู้เล่นก่อนหน้า
- **Online:** แต่ละคนใช้ Account ของตัวเองและเข้าห้องเดียวกัน
- ไพ่ในมือของผู้เล่นต้องมองเห็นได้เฉพาะเจ้าของมือและ Server
- Action ที่คว่ำหน้าต้องไม่เปิดเผยจนกว่าผู้เล่นที่ยังมีชีวิตจะส่งครบ หรือถึงเงื่อนไข Timeout (30 วินาที)
- Bot ต้องได้รับข้อมูลเฉพาะสิ่งที่ผู้เล่นตำแหน่งนั้นมีสิทธิ์รู้ และ Hand ของตัวเองเท่านั้น
- Browser ส่งเฉพาะเจตนาการเล่น (เช่น Card ID, target, choice) ห้ามส่งผลลัพธ์ เช่น HP ใหม่หรือ Damage ที่คำนวณแล้ว

## 5. UI Design System

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

## 6. Proposed Technical Baseline & Scaling Strategy

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend platform: Supabase Auth + PostgreSQL + Edge Functions + Realtime (ใช้ต่อเนื่องในระยะแรก ยังไม่ต้องย้ายไป Photon หรือ Nakama)
- Engine: Pure TypeScript package (`packages/game-engine`) แยกขาดจาก Supabase และ UI เพื่อให้ย้ายไปรันบน Dedicated Game Server ได้ทันทีในอนาคต
- Bot: Rule-based strategy on Server for initial release
- Hosting: Vercel for web frontend
- Scaling trigger: เมื่อผู้เล่นเพิ่มขึ้น ให้วัด **Load Test, Database Performance และ Realtime Latency** จริงก่อนตัดสินใจเพิ่ม Dedicated Server

**Security baseline:** RLS on exposed tables; private game data in a non-exposed schema; secret/service credentials only on Server; private Realtime channels; server-side validation and authorization on every command.

## 7. Rulebook v1 (Finalized Decisions)

กติกาทั้ง 15 ข้อต่อไปนี้ถูกล็อกเป็น **Rulebook v1 (`ruleset_version = 1`)** สำหรับนำไปเขียน Engine และ Unit Tests:

1. **Speed เท่ากัน (Tie-break):** ใช้ลำดับที่นั่ง (`seat` น้อยกว่าได้เล่นก่อน เช่น Seat 1 → 2 → 3 → 4) เพื่อให้ผลลัพธ์คาดเดาได้ 100% (Deterministic) และวางแผนกลยุทธ์ได้
2. **ค่า `speed` ระหว่างเกม:** ใช้ค่าเริ่มต้นของตัวละคร (`base speed`) ตลอดทั้ง Match เว้นแต่จะมี Effect ของการ์ด `chaos` ที่ระบุให้สลับลำดับในรอบนั้นเป็นการชั่วคราว
3. **Attack Target:** ผู้เล่นเลือกเป้าหมายตอน **Select**; หากระหว่าง Resolve เป้าหมายเดิมถูกคัดออก (`HP <= 0`) ไปก่อนแล้ว การโจมตีนั้นจะถือว่าพลาดเป้า (Fizzle) และไม่ย้ายเป้าอัตโนมัติ (ยกเว้นถูกเปลี่ยนเป้าด้วยการ์ด `chaos`)
4. **Defense:** เป็น **1-Damage Shield ตลอดทั้งรอบ** (ดูดซับดาเมจได้รวม 1 หน่วยในรอบนั้น เช่น โดนตี 2 ครั้ง ครั้งละ 1 ดาเมจ โล่จะกันครั้งแรกได้ 1 และครั้งที่สองจะเข้าตัว 1; ทำงานในรอบนั้นแม้ตัวละครจะ `speed` ช้ากว่าคนโจมตี เพราะถือเป็นการตั้งการ์ดเตรียมรับมือของรอบ)
5. **Chaos (กำหนด Effect มาตรฐาน 2 รูปแบบหลัก):**
   - **Redirect (สลับเป้าหมาย):** เลือกผู้เล่น A และ B (หรือสลับเป้าที่เล็งมาหาเราไปหาเป้าหมายอื่น) ให้ Action โจมตี/ก่อกวนที่เล็งเป้าเดิมเปลี่ยนไปโดนเป้าหมายใหม่แทน
   - **AoE / Disrupt:** ทำดาเมจ 1 หน่วยใส่ผู้เล่นอื่นทุกคนที่ยังมีชีวิต (`AoE`) หรือบังคับผู้เล่นเป้าหมายทิ้งการ์ดแบบสุ่ม 1 ใบ (`Disrupt`)
6. **Support:** ผู้เล่นต้องเลือกโหมด **`heal` หรือ `draw` ตั้งแต่ตอน Select** เพื่อให้ Server ตรวจสอบความถูกต้องของ Action ได้ทันที; หากเลือก `draw` ในขณะที่มือมี 5 ใบ (หลังจากใช้ใบ Support ออกไปแล้วจะเหลือ 4 ใบ จึงจั่วได้พอดี 1 ใบไม่เกินลิมิต)
7. **Draw เมื่อมือครบ 5 ใบ (Hand Limit):** ใช้กฎ **Skip Draw (ข้ามการจั่ว)** ในช่วงต้นรอบ (เพื่อไม่ต้องเพิ่ม Phase ทิ้งไพ่กลางเทิร์น ทำให้เกมไหลลื่นและกระตุ้นให้ผู้เล่นบริหารการ์ดบนมือ)
8. **Deck / Discard (40 ใบ):** Shared Deck มาตรฐานมี **40 ใบ** (`attack` 16 ใบ, `defense` 10 ใบ, `support` 8 ใบ, `chaos` 6 ใบ); เมื่อกองจั่วหมด ให้สับกอง Discard ทั้งหมดกลับเป็นกองจั่วใหม่ทันที (หากทั้ง Deck และ Discard หมดเกลี้ยง ให้ข้ามการจั่วโดยไม่เกิด Error)
9. **Breeze (`DISCARD_TO_DODGE`):** ทำงานแบบ **Auto-trigger ต่อ 1 Hit** (เมื่อกำลังจะได้รับความเสียหาย หากมีการ์ดบนมือ ระบบจะสุ่มทิ้งการ์ดบนมือ 1 ใบเพื่อหลบดาเมจทั้งหมดของ Hit นั้นทันที; หากในรอบเดียวกันโดนตีหลาย Hit และยังมีไพ่บนมือเหลือ ระบบจะทริกเกอร์หลบ Hit ถัดไปให้อัตโนมัติจนกว่าไพ่บนมือจะหมด)
10. **Pyro (`BONUS_DMG_FIRST_HIT`):** นับเฉพาะ **การโจมตีที่ทำความเสียหายเข้าตัวเป้าหมายได้จริงอย่างน้อย 1 หน่วย** (หลังจากหักการหลบของ Breeze, โล่ Defense และลดดาเมจของ Terra แล้ว) ถึงจะได้โบนัส +1 ดาเมจและใช้สิทธิ์ของรอบนั้นไป (ถ้าถูกหลบหรือถูกกันจนเหลือ 0 สิทธิ์โบนัสยังไม่ถูกใช้และจะไปทำงานในการโจมตีครั้งถัดไปในรอบเดียวกันหากมี)
11. **Aqua (`SWAP_CARD_ONCE`):** กดใช้งานได้ในช่วง **`onTurnStart` (หลังจั่วไพ่ต้นรอบ และก่อนเข้าสู่เฟส Select)** โดยเลือกเป้าหมายที่ยังมีชีวิต (`alive`) 1 คน เพื่อสุ่มสลับไพ่ 1 ใบบนมือของเรากับไพ่สุ่ม 1 ใบบนมือของเป้าหมาย (ไม่สามารถสลับกับผู้เล่นที่ถูกคัดออกแล้วได้)
12. **Hook Timing & Ordering:**
    - ลำดับต่อ 1 การโจมตี: `onAttack` (ของผู้โจมตี) → `onBeforeDamaged` (ของผู้รับดาเมจ: Breeze ทำงานก่อน Terra) → หัก Defense Shield → ลด HP → `onAfterDamaged` (ของผู้รับดาเมจ หากยัง `HP > 0`)
    - หากมีหลายตัวละครทริกเกอร์ Hook เดียวกันพร้อมกัน ให้เรียงตาม **`speed` จากมากไปน้อย** (เท่ากันใช้ `seat` น้อยกว่าขึ้นก่อน)
13. **HP เป็นศูนย์ระหว่าง Resolve:** ผู้เล่นที่ `HP <= 0` จะถูกปรับสถานะเป็น `eliminated` **ทันที** และ **ยกเลิก Action ที่เลือกไว้** หากยังไม่ถึงคิว `speed` ของตน
14. **ผู้เล่น Disconnect / Timeout:** กำหนดเวลาเลือกการ์ดในเฟส Select ที่ **30 วินาที** หากหมดเวลาหรือหลุดการเชื่อมต่อ ให้ **Server Bot เข้าควบคุมและเลือก Action แทนอัตโนมัติ** ทันทีเพื่อให้เกมดำเนินต่อได้โดยไม่ค้าง (หากผู้เล่นกลับมา Reconnect สามารถควบคุมต่อในรอบถัดไปได้)
15. **กรณีไม่มีผู้รอดชีวิต (Simultaneous Elimination):** หากในรอบเดียวกันผู้เล่นที่เหลือทั้งหมดถูกคัดออกพร้อมกันจนไม่มีใครเหลือ `HP > 0` ให้ตัดสินผลการแข่งขันเป็น **เสมอ (Draw)**

## 8. Versioning & Compatibility

- ทุก Match ต้องเก็บ `engine_version` และ `ruleset_version` (เริ่มต้นที่ `ruleset_version = "1"`)
- Snapshot ข้อมูล Character/Card ที่ใช้ใน Match เพื่อไม่ให้การเปลี่ยน Balance ภายหลังแก้ผลของ Match เก่า
- การเปลี่ยนกติกาที่มีผลต่อผลเกมต้องเพิ่ม `ruleset_version`
- Migration ฐานข้อมูลต้องเก็บเป็นลำดับไฟล์และนำกลับมาใช้ซ้ำได้

## 9. Definition of Done (Core v1)

- กติกาในหัวข้อ 2 และ Rulebook v1 ในหัวข้อ 7 ถูกนำไปสร้างใน `packages/game-engine` ครบถ้วน
- Engine Unit Tests ครอบคลุม Draw, Hand Limit, Target Validation, Damage, Defense Shield, Support, Chaos, Hooks (Pyro, Aqua, Breeze, Terra), Elimination, Timeout Auto-Bot และ Win/Draw Condition
- Bot เลือกได้เฉพาะ Action ที่ถูกต้อง
- Client ไม่สามารถอ่านไพ่/Action ลับของผู้เล่นอื่น
- Client ไม่สามารถเขียน HP หรือผล Resolve โดยตรง
- คำสั่งซ้ำหรือคำสั่งจาก Version เก่าไม่ทำให้เกมเปลี่ยนซ้ำ
- เล่น Solo จนจบ Match ได้ด้วย Server Engine

---

## Change Log

### v2.1 (Rulebook v1)
- ล็อกกติกาทั้ง 15 ข้อในหัวข้อ 7 เป็น **Rulebook v1** (Speed tie-break, Defense shield, Chaos effects, Deck 40 ใบ, Hook ordering, Breeze/Pyro/Aqua/Terra mechanics, 30s Timeout Auto-Bot และ Draw condition)
- อัปเดตแนวทาง Technical Baseline & Scaling Strategy ให้ใช้ Supabase + Vercel ต่อเนื่อง แยก Pure Game Engine และวัด Load/Latency ก่อนเพิ่ม Dedicated Server

### v2.0-draft
- เพิ่มทิศทาง Product: Account required, Server Bot, Free now / monetization later
- เพิ่มข้อกำหนด Server-authoritative และ Information Security
- เพิ่มแนวทางเทคนิคขั้นต่ำและ Versioning
- รวม Starter Characters และ UI tokens จาก Spec เดิม