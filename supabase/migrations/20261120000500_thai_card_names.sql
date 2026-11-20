-- Task 9.7 — Thai card names (owner decision 2026-11-20). Display text only: no rule change.
-- Mirrors packages/game-engine/src/rules/v2/cards.ts (drift test: tests/architecture/seed-v2.test.ts).

update public.card_definitions set name = 'เป็ดยางจิ๋ว' where id = 'U001_RUBBER_DUCKLING';
update public.card_definitions set name = 'ผู้พิทักษ์กระป๋อง' where id = 'U002_TIN_CAN_GUARDIAN';
update public.card_definitions set name = 'เครื่องร่อนกระดาษ' where id = 'U003_PAPER_GLIDER';
update public.card_definitions set name = 'ไฟฉายพกพา' where id = 'U004_POCKET_FLASHLIGHT';
update public.card_definitions set name = 'สเก็ตบอร์ดจิ๋ว' where id = 'U005_MINI_SKATEBOARD';
update public.card_definitions set name = 'โกเลมกระติกน้ำ' where id = 'U006_THERMOS_GOLEM';
update public.card_definitions set name = 'เพื่อนถ่านไฟฉาย' where id = 'U007_BATTERY_BUDDY';
update public.card_definitions set name = 'หุ่นยนต์ไขลาน' where id = 'U008_WINDUP_ROBOT';
update public.card_definitions set name = 'เป็ดยางเทอร์โบ' where id = 'U101_TURBO_BATH_DUCK';
update public.card_definitions set name = 'ป้อมกระป๋องเหล็ก' where id = 'U102_STEEL_CAN_BASTION';
update public.card_definitions set name = 'เจ็ตกระดาษ' where id = 'U103_PAPER_JET';
update public.card_definitions set name = 'ไฟฉายสุริยะ' where id = 'U104_SOLAR_SEARCHLIGHT';
update public.card_definitions set name = 'สเก็ตบอร์ดจรวด' where id = 'U105_ROCKET_SKATEBOARD';
update public.card_definitions set name = 'โกเลมถังแรงดัน' where id = 'U106_PRESSURE_TANK_GOLEM';
update public.card_definitions set name = 'พาวเวอร์แบงก์ยักษ์' where id = 'U107_PORTABLE_POWER_HUB';
update public.card_definitions set name = 'หุ่นไขลานคลั่ง' where id = 'U108_OVERWOUND_CLOCKWORK';
update public.card_definitions set name = 'เป็ดร่อนสะเทินน้ำ' where id = 'U201_AMPHIBIOUS_GLIDER';
update public.card_definitions set name = 'กาต้มน้ำป้อมปราการ' where id = 'U202_FORTRESS_KETTLE';
update public.card_definitions set name = 'สเก็ตสายฟ้า' where id = 'U203_ELECTRIC_RIDE';
update public.card_definitions set name = 'ขีดเขียนด่วน' where id = 'A001';
update public.card_definitions set name = 'ของหายได้คืน' where id = 'A002';
update public.card_definitions set name = 'เก็บเศษมาใช้ใหม่' where id = 'A003';
update public.card_definitions set name = 'ใบพัดหนีบ' where id = 'E001';
update public.card_definitions set name = 'ฝาเสริมเกราะ' where id = 'E002';
update public.card_definitions set name = 'ที่ชาร์จพลัง' where id = 'E003';
