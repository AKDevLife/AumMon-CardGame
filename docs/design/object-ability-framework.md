# AumMon — Object & Ability Framework (Ruleset 3 design)

> Status: **Owner-approved direction, provisional until playtest** (owner 2026-11-21: "ทำตามคำแนะนำทั้งหมด").
> Source: `docs/design/AumMon_New_Game_Direction_Handoff.zip` + audit report (decisions D1–D11 in `docs/rule-clarifications.md` §R3).
> This file is the design input for `ruleset_version = "3"`. It becomes Game Spec v4.0 in task 10.9; until then the spec v3.0 stays authoritative for ruleset "2".

## 1. What stays (Core Rules kept from spec v3.0 §4)

1v1 · Player HP 20 · Deck 30 (max 3 copies) · hand 5, mulligan once · hand limit 10 · SPARK 1→8 (+1 per own Start Phase, refill) · 3 unit slots · Main → Battle one way (R2-6) · units enter Exhausted (except Haste) · attack exhausts · simultaneous damage `Damage = ATK` · Fatigue · draw = both 0 HP · turn timer 90 s · Guard / Flying / Piercing / Haste exactly as spec §5.18 (Guard protects only while Ready — owner confirmed 2026-11-21).

## 2. What changes

| Area       | Ruleset 3                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| Card types | **Object only** (internal type `unit`). No Action, Equipment, Field, Evolution, Fusion, Recipes (D4).                       |
| Stats      | ATK / HP only — no DEF (D1).                                                                                                |
| Keywords   | Haste, Guard, Flying, Piercing (D6). Boost and Draw/Search are no longer keywords (D3); drawing/searching are abilities.    |
| Abilities  | Each Object has at most **1 Passive + 1 Active** (D5).                                                                      |
| Traits     | Category tags (STATIONERY, CONTAINER, VEHICLE, ELECTRONIC, TOOL, HOUSEHOLD); abilities may reference them for synergy (D7). |
| Rarity     | Cosmetic only; set later (D11).                                                                                             |

## 3. Ability rules

### 3.1 Active Ability (D2 — option A)

1. Only by the owner, in their **Main Phase**, while the match is active.
2. Source Object must be **Ready**.
3. Max **once per turn per Object**.
4. Targets and conditions are validated **before** paying; an Active with no legal target cannot be used.
5. Pay the SPARK cost (every Active costs ≥ 1 SPARK).
6. The source becomes **Exhausted** — unless the card says **"ไม่ทำให้เหนื่อย" (no exhaust)**, used for self-pump abilities that would otherwise be pointless.
7. Resolve the effect, then state-based checks (destroy HP ≤ 0, win check), then triggers.

### 3.2 Passive Ability

- **Static:** always on while the source is on the field; recomputed (never queued). Ends immediately when the source leaves.
- **Triggered:** fires on an event of its source. Triggers (v1): `on_summon` (this enters), `on_attack` (this declares an attack, before damage), `on_destroyed` (this is destroyed), `on_turn_start` / `on_turn_end` (owner's turn).
- Triggered Passives use **automatic targets only** (self, all allies, all enemies, players) — no player choice mid-resolution.

### 3.3 Resolution order & safety

- One command → its effect → state-based check → queued triggers in order: active player's first, then by slot left→right; new triggers append to the end of the queue (spec §5.7).
- A trigger whose source left the field still resolves (it already triggered); static effects stop.
- Missing / dead target → that effect does nothing (no error).
- Limits (spec §5.15): max 100 effects per command, chain depth 20 → engine error (bug, never normal play).
- Idempotency key per command (existing server flow) prevents double payment.

### 3.4 Effects (v1 set)

`atk` (±ATK; duration this turn / until your next turn / permanent) · `max_hp` (+HP permanent) · `damage` · `heal` (never above max HP; players never above 20) · `draw` · `exhaust` · `ready` · `keyword` (grant a keyword for a duration) · `search` (card with a trait from deck → hand, revealed, then shuffle).

Durations: **this turn** (ends at end of turn) · **until your next turn** (ends at the start of the ability owner's next turn) · **permanent** (while on the field).

## 4. Power budget (provisional)

Base guideline spec §4.12 (`ATK + HP` by cost). Objects with abilities may sit **up to 3 below the minimum** (ability value); nothing may exceed the maximum. Dual-ability cards pay for both. To be tuned with simulation + playtest (D11).

## 5. Prototype set — 24 Objects

Distribution: 8 Passive-only · 8 Active-only · 8 Dual; 6 per archetype (2/2/2). Framework check cards (first 6, D8 — validated by engine simulation, not a playable 6-card deck): O01, O06, O07, O13, O19, O22.

| ID  | ชื่อ (Object)                | Arch      | Cost | ATK/HP | KW       | Traits                | Passive                                            | Active (SPARK)                                              |
| --- | -------------------------- | --------- | ---: | -----: | -------- | --------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| O01 | ดินสอไม้ (Pencil)            | Aggro     |    1 |    2/2 | –        | STATIONERY            | ไส้หัก: เมื่อถูกทำลาย ทำดาเมจ 1 ผู้เล่นฝ่ายตรงข้าม           | –                                                           |
| O02 | รถแข่งจิ๋ว (Toy Racer)        | Aggro     |    2 |    2/2 | Haste    | VEHICLE               | เร่งเครื่อง: เมื่อโจมตี +1 ATK เทิร์นนี้                     | เทอร์โบ (1): +2 ATK เทิร์นนี้ · ไม่ทำให้เหนื่อย                      |
| O03 | หนังยาง (Rubber Band)       | Aggro     |    1 |    1/2 | –        | STATIONERY            | –                                                  | ดีด (1): ดาเมจ 1 ใส่ศัตรูหรือผู้เล่นฝ่ายตรงข้าม                       |
| O04 | จักรยาน (Bicycle)           | Aggro     |    3 |    3/4 | Haste    | VEHICLE               | ปั่นเป็นขบวน: +1 ATK ถ้ามี VEHICLE ฝ่ายเราอีกตัว           | –                                                           |
| O05 | กรรไกร (Scissors)          | Aggro     |    2 |    3/2 | Piercing | STATIONERY, TOOL      | –                                                  | ตัดฉับ (2): ดาเมจ 2 ใส่ศัตรู                                     |
| O06 | จรวดขวดน้ำ (Bottle Rocket)  | Aggro     |    3 |    3/3 | Flying   | VEHICLE               | จุดชนวน: เมื่อลงสนาม ดาเมจ 1 ผู้เล่นฝ่ายตรงข้าม            | พุ่งชน (2): ดาเมจ 2 ผู้เล่นฝ่ายตรงข้าม                             |
| O07 | กระเป๋าเป้ (Backpack)        | Defensive |    2 |    1/5 | Guard    | CONTAINER             | ช่องกันกระแทก: Object อื่นฝ่ายเรา +1 HP                 | ช่องฉุกเฉิน (1): ฟื้น 2 HP ให้ Object ฝ่ายเรา                      |
| O08 | กล่องกระดาษ (Cardboard Box) | Defensive |    1 |    0/5 | Guard    | CONTAINER             | ของในกล่อง: เมื่อถูกทำลาย จั่ว 1                         | –                                                           |
| O09 | ร่ม (Umbrella)              | Defensive |    2 |    2/4 | Guard    | HOUSEHOLD             | กางรับฝน: เริ่มเทิร์นเรา ฟื้น 2 HP ให้ตัวเอง                | –                                                           |
| O10 | กระติกน้ำแข็ง (Cooler)        | Defensive |    3 |    2/6 | Guard    | CONTAINER             | –                                                  | ประคบเย็น (1): ฟื้น 3 HP ให้ Object ฝ่ายเราหรือผู้เล่นเรา            |
| O11 | หมวกกันน็อก (Helmet)         | Defensive |    2 |    2/4 | –        | HOUSEHOLD             | –                                                  | สวมกันกระแทก (1): Object อื่นฝ่ายเราได้ Guard จนถึงเทิร์นถัดไปของเรา |
| O12 | ประตูไม้ (Wooden Door)       | Defensive |    4 |    2/8 | Guard    | HOUSEHOLD             | ปิดบ้าน: เมื่อลงสนาม ฟื้น 3 HP ผู้เล่นเรา                   | ล็อกประตู (2): ทำให้ศัตรู 1 ตัวเหนื่อย                              |
| O13 | นาฬิกาปลุก (Alarm Clock)     | Control   |    2 |    2/3 | –        | ELECTRONIC            | ปลุกเช้า: เมื่อลงสนาม จั่ว 1                             | เลื่อนปลุก (1): ทำให้ศัตรู 1 ตัวเหนื่อย                              |
| O14 | ยางลบ (Eraser)             | Control   |    2 |    1/3 | –        | STATIONERY            | –                                                  | ลบทิ้ง (3): ดาเมจ 3 ใส่ศัตรู                                     |
| O15 | ไฟฉาย (Flashlight)         | Control   |    3 |    2/3 | –        | ELECTRONIC            | แสงจ้า: เมื่อลงสนาม ดาเมจ 1 ใส่ศัตรูทุกตัว                 | –                                                           |
| O16 | กาวน้ำ (Glue)               | Control   |    2 |    1/4 | –        | STATIONERY            | –                                                  | ติดหนึบ (1): ศัตรู 1 ตัว −2 ATK จนถึงเทิร์นถัดไปของเรา               |
| O17 | เครื่องดูดฝุ่น (Vacuum)         | Control   |    5 |    4/6 | –        | ELECTRONIC, HOUSEHOLD | ดูดพลัง: เมื่อลงสนาม ศัตรูทุกตัว −1 ATK จนถึงเทิร์นถัดไปของเรา | ดูดแรง (2): ดาเมจ 2 ใส่ศัตรู                                    |
| O18 | วิทยุ (Radio)                | Control   |    3 |    1/4 | –        | ELECTRONIC            | ข่าวต้นชั่วโมง: เริ่มเทิร์นเรา จั่ว 1                        | –                                                           |
| O19 | กล่องดินสอ (Pencil Case)     | Synergy   |    2 |    1/4 | –        | CONTAINER, STATIONERY | เก็บครบชุด: STATIONERY อื่นฝ่ายเรา +1 ATK               | –                                                           |
| O20 | ปลั๊กพ่วง (Power Strip)       | Synergy   |    2 |    1/4 | –        | ELECTRONIC            | –                                                  | จ่ายไฟ (1): ELECTRONIC อื่นฝ่ายเราที่เหนื่อย กลับมาพร้อม              |
| O21 | ประแจ (Wrench)             | Synergy   |    2 |    2/3 | –        | TOOL                  | หยิบเครื่องมือ: เมื่อลงสนาม ค้นหา TOOL 1 ใบจากเด็คขึ้นมือ     | ขันแน่น (1): Object ฝ่ายเรา +2 HP ถาวร                         |
| O22 | ค้อน (Hammer)               | Synergy   |    3 |    3/4 | –        | TOOL                  | ทีมช่าง: +1 ATK ต่อ TOOL อื่นฝ่ายเรา                     | –                                                           |
| O23 | ไขควง (Screwdriver)        | Synergy   |    1 |    2/2 | –        | TOOL                  | –                                                  | ไขทะลุ (1): TOOL อื่นฝ่ายเราได้ Piercing เทิร์นนี้                   |
| O24 | รถบรรทุกของเล่น (Toy Truck)  | Synergy   |    4 |    3/6 | –        | VEHICLE               | ขนของ: เมื่อลงสนาม ค้นหา VEHICLE 1 ใบจากเด็คขึ้นมือ       | ส่งของ (2): ฟื้น 2 HP ให้ Object ฝ่ายเราทุกตัว                     |

"ศัตรู" = Object ฝ่ายตรงข้าม. Card art: Living Objects (face, arms, legs) — placeholder art by Claude until real art (D10).

### Starter Deck v3 (30)

All 24 × 1, plus a second copy of O01, O03, O08, O13, O19, O23.

## 6. Test checklist (from handoff §10.2)

Ready vs Exhausted source · not enough SPARK · second activation same turn · invalid / vanished target · several triggers at once (order) · trigger chains + loop limit · HP 0 destroy · source leaves during resolution · duplicate request (idempotency) · static aura removed → HP drop kills · Guard granted until next turn expires correctly.
