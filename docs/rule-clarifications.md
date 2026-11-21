# Rule Clarifications

> เกมใช้ Everyday Objects Battle (Spec v4.0, `ruleset_version = "3"`) เท่านั้น. Ruleset 1 (2–4 คน) และ 2 (Evolution/Fusion/Equipment) ถูกยกเลิก — R2-x ที่ยังใช้: R2-2 SPARK, R2-3 มือ 10 ใบ, R2-4 Direct Attack/Guard, R2-5 สุ่มคนเริ่ม, R2-6 Main→Battle; R2-7/R2-8 (Action) ไม่ใช้แล้ว

> ไฟล์นี้ **ไม่แก้ไข** กติกาใน `aummon_game_spec.md` — บันทึกเฉพาะประเด็นที่ Spec ยังไม่ระบุหรือขัดกัน
> **Provisional** = วิธีที่เลือกไปก่อน และจะปรับหลัง Playtest
> การปรับภายหลังที่กระทบผลเกม ให้บันทึกที่นี่และพิจารณาเพิ่ม `ruleset_version`

## C1 — Master Handoff (1v1 TCG) vs Rulebook v1 — ✅ Resolved 2026-11-20

เจ้าของเลือกเปลี่ยนเกมทั้งหมดเป็น TCG 1v1 ตาม Handoff v1.1 และรวมเป็น `aummon_game_spec.md` v3.0 ไฟล์เดียว; คงเมนู/Auth/ระบบอื่นเดิม. คงทั้ง 3 โหมด (1v1), Starter Deck สำเร็จรูป, Turn timer 90 วินาที → จบเทิร์นอัตโนมัติ.

## R2-1 — V1.0 leftovers in spec — ✅ Resolved 2026-11-20

เจ้าของยืนยัน: ยึดกติกาใหม่ (V1.1) เท่านั้น ตัดกติกาเก่าทิ้ง. ลบข้อความ V1.0 ใน Spec §5.12, §5.14, §5.17, §11 แล้ว.

## R2-2 … R2-5 — Core flow decisions — ✅ Owner decided 2026-11-20 (provisional until playtest)

- **R2-2 SPARK:** เทิร์นแรกของแต่ละคนมี 1 SPARK (Max เริ่ม 0 แล้ว +1 ทุก Start Phase ของตัวเอง, สูงสุด 8)
- **R2-3 Hand limit:** สูงสุด 10 ใบ; จั่วตอนมือเต็ม → การ์ดใบนั้นลง Discard
- **R2-4 Direct Attack:** ตีผู้เล่นได้เมื่อฝ่ายตรงข้ามไม่มี Guard ที่ Ready (ใช้ในงาน 8.4)
- **R2-5 First player:** Server สุ่ม (seeded RNG)
- Mulligan: ทั้งสองฝ่ายทำก่อนเริ่มเทิร์นแรก (ส่งรายการว่างได้)
- **R2-6 Phase order:** Main → Battle ทางเดียว; การโจมตีครั้งแรกเข้าสู่ Battle Phase แล้วลงการ์ด/Boost/Evolution ไม่ได้จนจบเทิร์น
- **R2-7 Search:** ผู้เล่นเลือกชนิดการ์ดที่ค้นหาจาก Deck; การ์ดที่ได้ถูกเปิดเผย แล้วสับ Deck
- **R2-8 Action ไม่มีเป้าหมาย:** ห้ามใช้ (เช่น Scrap Return เมื่อ Discard ไม่มี Equipment)

## R2-9 — Card names in Thai — ✅ Owner decided 2026-11-20

แทนการตัดสินใจเดิม (ชื่ออังกฤษ): ชื่อการ์ด ข้อความบนการ์ด และ Keyword แสดงเป็นภาษาไทยทั้งหมด (ดู Spec §1.6) — ข้อความแสดงผลเท่านั้น ไม่เปลี่ยนกติกา

## R3 — New direction "Everyday Objects Battle" — ✅ Owner decided 2026-11-21 (provisional until playtest)

Owner approved every recommendation of the audit ("ทำตามคำแนะนำทั้งหมด") and asked to focus on the new rules, then delete the old ones. Rules now in `aummon_game_spec.md` v4.0 (task 10.5); source brief: `docs/design/AumMon_New_Game_Direction_Handoff.zip`. New results need `ruleset_version = "3"`; ruleset "2" code is removed after the switch.

- **D1 DEF:** not reintroduced — ATK / HP only.
- **D2 Active:** Main Phase only, source Ready, pay SPARK (≥1), source becomes Exhausted unless the card says "no exhaust", once per turn per Object, targets checked before paying.
- **D3 Boost:** no longer a keyword — becomes card Active text.
- **D4 Card types:** Object only; Action / Equipment / Field / Evolution / Fusion removed. Draw / Search live on abilities.
- **D5 Abilities per card:** max 1 Passive + 1 Active.
- **D6 Keywords:** Haste, Guard, Flying, Piercing kept unchanged.
- **D7 Traits:** category tags that abilities may reference (synergy).
- **D8 Framework check:** the first 6 cards are validated by engine simulation (a 30-card deck needs ≥ 10 card types), then the 24-card set.
- **D9 Ruleset:** `"3"`; ruleset "2" retired after the switch (owner: delete old rules once the new ones work).
- **D10 Art:** placeholder Living-Objects art by Claude until real art.
- **D11 Rarity / launch set size / numeric power budget:** after playtest.

## R4 — Flexible turn & Guard while asleep — ✅ Owner decided 2026-11-21 (ruleset "5")

Supersedes R2-4 (Guard only when Ready) and R2-6 (Main → Battle one way), and D2's "source must be Ready / sleeps after use": actions in any order during your turn; Active usable while asleep, once per turn, does not put the Object to sleep (except "หลับตอนจบเทิร์น"); Guard works while asleep and must be attacked first (no attacking other Objects or the player); Guard and Flying never combine. Spec v6.0 §4.4, §5.1, §5.3.
