# Rulebook v1 — Open Clarification Questions

> **สถานะ: รอเจ้าของผลิตภัณฑ์ตอบ** — ไฟล์นี้ **ไม่ใช่กติกา** และไม่แก้ไข Rulebook v1 (15 ข้อใน `aummon_game_spec.md` §7)
> ใช้บันทึกประเด็นที่เอกสารยังไม่ได้ระบุ ซึ่งต้องได้คำตอบก่อนเขียน Resolver / Seed การ์ดใน Phase 3
> เมื่อได้คำตอบแล้ว ให้บันทึกคำตอบที่ได้รับอนุมัติไว้ใต้แต่ละข้อ (ห้ามเดาคำตอบเอง)

| #   | หัวข้อ                 | คำถาม                                                                                                                               | อ้างอิง                   | บล็อกงาน         |
| --- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------- |
| 1   | Chaos deck mix       | การ์ด `chaos` 6 ใบ แบ่งเป็น Redirect / AoE / Disrupt อย่างละกี่ใบ, ID และชื่อการ์ดแต่ละใบ                                                     | Spec §2, Rule 5, Rule 8 | Seed, Engine    |
| 2   | Redirect semantics   | สลับ A↔B หรือเบนการโจมตีที่เล็งมาหาตัวเอง; ถ้า Redirect ช้ากว่าการโจมตีที่จะถูกเบนเกิดอะไรขึ้น; มีผลกับ Disrupt หรือไม่; Command ต้องรองรับ 2 เป้าหมายหรือไม่ | Rule 5                  | Engine, API, DB |
| 3   | Chaos speed swap     | Rule 2 อ้างว่า Chaos สลับลำดับ speed ได้ แต่ Rule 5 ไม่มี Effect ประเภทนี้                                                                    | Rule 2 vs Rule 5        | Engine          |
| 4   | Pyro bonus timing    | โบนัส +1 คำนวณหลังดาเมจฐานเข้าตัว ≥ 1 (หลังหลบ/โล่/Terra) ใช่หรือไม่ ทั้งที่ `onAttack` ทำงานก่อน `onBeforeDamaged`                               | Rule 10 vs Rule 12      | Engine          |
| 5   | AoE as a Hit         | AoE นับเป็น Hit/การโจมตีสำหรับ Breeze, Terra, Defense shield และ Pyro หรือไม่                                                             | Rule 5, 9, 10           | Engine          |
| 6   | Support edge cases   | Rule 6 ประโยคไม่จบ — ยืนยันว่า `draw` ตอนมือ 5 ใบได้; `heal` ตอน HP เต็มเป็น Action ที่ legal หรือไม่                                           | Rule 6                  | Validator       |
| 7   | Aqua activation      | ผู้เล่นเลือกใช้เอง (ต้องมี input/timeout/endpoint) หรือ auto; กรณีมือของตนหรือเป้าหมายว่าง; Bot ใช้เมื่อใด                                          | Rule 11                 | Engine, API     |
| 8   | Card zones           | การ์ดที่เล่นแล้ว, Action ที่ถูกยกเลิก และมือของผู้ถูกคัดออก ไปที่ Discard หรือไม่                                                                     | Rule 8, 13              | Engine          |
| 9   | Targeting            | โจมตีตัวเองได้หรือไม่; Disrupt ใส่เป้าหมายมือว่าง; Defense ต้องมี target หรือไม่                                                                 | Rule 3, 5               | Validator       |
| 10  | Duplicate characters | ผู้เล่นในห้องเดียวกันเลือกตัวละครซ้ำได้หรือไม่                                                                                                  | Spec §2                 | Lobby           |
| 11  | Timeout scope        | Timeout 30s ใช้กับ Solo และ Pass & Play ด้วยหรือไม่                                                                                      | Rule 14                 | Server          |
| 12  | Bot difficulty       | v1 ต้องมี easy/normal/hard ครบ หรือเริ่มที่ระดับเดียว                                                                                        | Blueprint §5.6          | Bot             |
