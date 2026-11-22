# AumMon — Casual Discard Edition · Card Library (16 Objects × 4 copies)

> Status: approved direction (owner 2026-11-22: DC3 Umbrella reaction, DC4 Magnet/Hourglass redesign, DC5 Eraser wild). Balance numbers come in Phase 3 (`AumMon_Card_Balance.md`). Abilities are optional after playing (Core Rules §4).

| ID  | Card       | Pts | Ability (Thai text)                                                                 | Target                 | Duration        | Rule notes                                        | Last card? |
| --- | ---------- | --: | ----------------------------------------------------------------------------------- | ---------------------- | --------------- | ------------------------------------------------- | ---------- |
| D01 | หนังยาง     |   2 | **ดีด:** ผู้เล่นคนถัดไปจั่วเพิ่ม 1 ใบ                                                        | next player            | instant         | Umbrella can block                                | yes        |
| D02 | กาวน้ำ      |   3 | **ติดหนึบ:** เลือกผู้เล่น 1 คน เทิร์นถัดไปของเขาลงไพ่แต้มต่ำกว่า 4 ไม่ได้                          | chosen player          | their next turn | Eraser on top removes it                          | yes        |
| D03 | ยางลบ      |   1 | **ลบเงื่อนไข:** ลงทับไพ่ใบไหนก็ได้ ล้างแต้มและเอฟเฟกต์ของกอง คนถัดไปลงไพ่แต้มไหนก็ได้             | pile                   | until next play | Wild (DC5); also cancels Ruler / Glue             | yes        |
| D04 | กรรไกร     |   4 | **ตัด:** นำไพ่ใบใต้กรรไกรออกจากเกม แล้วลงไพ่ในมือเพิ่มได้อีก 1 ใบ (ต้องตามกฎแต้มกับไพ่บนกองตอนนั้น) | pile                   | instant         | Extra card's ability may be used                  | yes        |
| D05 | กล่องกระดาษ |   3 | **เก็บของ:** นำไพ่ใบใต้กล่องขึ้นมือ แล้ววางไพ่ใบอื่นจากมือ 1 ใบไว้บนกอง (ไม่ใช้ความสามารถของใบนั้น)  | pile + own hand        | instant         | Placed card counts as the new top                 | yes        |
| D06 | นาฬิกาปลุก   |   5 | **ปลุก:** สลับทิศทางการเล่น และผู้เล่นคนอื่นทุกคนจั่วเพิ่มคนละ 1 ใบ                               | all others             | instant         | Each target may Umbrella                          | yes        |
| D07 | แม่เหล็ก     |   4 | **ดูดติด:** ส่งไพ่ 1 ใบจากมือเราไปติดผู้เล่นที่มีไพ่น้อยที่สุด                                       | fewest cards (not you) | instant         | Tie: next in turn order; redesigned (DC4)         | yes        |
| D08 | แว่นขยาย    |   2 | **ส่อง:** เลือกผู้เล่น 1 คน ดูไพ่ในมือเขาแบบลับ 2 ใบ (สุ่ม)                                    | chosen player          | instant         | Only you see them                                 | yes        |
| D09 | ไม้บรรทัด    |   5 | **ตีเส้น:** ผู้เล่นคนถัดไปต้องลงไพ่แต้ม 5 เท่านั้น ไม่งั้นจั่ว 1 ใบและผ่าน                            | next player            | their next turn | Eraser / Umbrella answer it                       | yes        |
| D10 | เทปกาว     |   6 | **แปะคู่:** หลังลงเทปกาว ลงไพ่ 2 ใบที่แต้มเท่ากันเพิ่มได้ทันที (ไม่ต้องสูงกว่ากอง)                    | own hand               | instant         | Pair's abilities not used _(proposed)_            | yes        |
| D11 | ถังขยะ      |   1 | **ทิ้งกาก:** ทิ้งไพ่ในมือ 1 ใบออกจากเกม แล้วจั่วใหม่ 1 ใบ                                     | own hand               | instant         | —                                                 | yes        |
| D12 | ไฟฉาย      |   6 | **ส่องสว่าง:** เปิดไพ่ในมือทุกคนให้ทุกคนเห็น 5 วินาที แล้วเลือกผู้เล่น 1 คนจั่วเพิ่ม 1 ใบ               | all + chosen           | instant         | Draw can be Umbrella'd                            | yes        |
| D13 | กุญแจ       |   7 | **ล็อก:** ข้ามเทิร์นของผู้เล่นคนถัดไป 1 เทิร์น                                                | next player            | instant         | Umbrella can block                                | yes        |
| D14 | พัดลม       |   4 | **เป่า:** ผู้เล่นที่มีไพ่น้อยที่สุด (ไม่นับเรา) จั่วเพิ่ม 1 ใบ                                        | fewest cards           | instant         | Tie: next in turn order                           | yes        |
| D15 | นาฬิกาทราย  |   3 | **ย้อนเวลา:** ใช้ความสามารถของไพ่ใบก่อนหน้า (ใบใต้นาฬิกาทราย) ซ้ำอีกครั้ง                      | pile                   | instant         | Redesigned (DC4); no effect if that card has none | yes        |
| D16 | ร่ม         |   8 | **กางกัน:** ลงสวนนอกเทิร์นได้ เมื่อถูกบังคับจั่วหรือข้ามเทิร์น ยกเลิกผลนั้นกับเรา                      | self                   | instant         | Reaction (DC3); normal 8 on your turn             | yes        |

Data fields for the engine (brief §4.2): id, name, points, category, ability name / text, trigger (on play / reaction), target, effect, duration, restrictions, canActivate, canBeFinalCard, balanceRating — stored as data so new cards need no engine rewrite.
