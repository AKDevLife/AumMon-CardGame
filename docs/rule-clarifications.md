# Rule Clarifications

> เกมใช้ TCG 1v1 (Spec v3.0, `ruleset_version = "2"`) เท่านั้น. กติกาเก่า 2–4 คนและคำตีความ Q1–Q12 ถูกยกเลิก (ดูได้จาก Git history)

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
