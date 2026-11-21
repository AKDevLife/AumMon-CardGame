-- Task 11.1 — Ruleset 4 (owner 2026-11-21): Active abilities are free (no SPARK); stronger
-- Objects cost more to summon; Toy Racer's Turbo sleeps at end of turn. Same 24 Object ids:
-- rows are updated in place (definition_version 2). Unfinished ruleset 3 matches are abandoned.
-- Card data mirrors packages/game-engine/src/rules/v4 (drift test: tests/architecture/seed-v4.test.ts).

alter table public.card_definitions drop constraint card_definitions_ruleset_version_check;
alter table public.card_definitions add constraint card_definitions_ruleset_version_check
  check (ruleset_version in ('1','2','3','4'));
alter table public.card_definitions drop constraint card_definitions_card_type_check;
alter table public.card_definitions add constraint card_definitions_card_type_check check (
  (ruleset_version = '1' and card_type in ('attack','defense','support','chaos'))
  or (ruleset_version = '2' and card_type in ('unit','action','equipment','field')
      and rarity is not null and stage is not null and cost is not null
      and (card_type <> 'unit' or (atk is not null and hp > 0)))
  or (ruleset_version in ('3','4') and card_type = 'unit' and rarity is not null and cost is not null
      and atk is not null and hp > 0)
);
alter table public.deck_templates drop constraint deck_templates_ruleset_version_check;
alter table public.deck_templates add constraint deck_templates_ruleset_version_check
  check (ruleset_version in ('1','2','3','4'));
alter table public.game_rooms drop constraint game_rooms_ruleset_version_check;
alter table public.game_rooms add constraint game_rooms_ruleset_version_check
  check (ruleset_version in ('1','2','3','4'));

update public.matches set status = 'abandoned', finished_at = now()
  where ruleset_version = '3' and status in ('created','active');
update public.game_rooms set status = 'closed'
  where ruleset_version = '3' and status <> 'closed';
update public.deck_templates set is_active = false where ruleset_version = '3';

insert into public.card_definitions (id, name, card_type, description, effect_spec, ruleset_version, rarity, stage, cost, atk, hp, traits, keywords, slot_cost, deckable) values
  ('O01', 'ดินสอไม้', 'unit', 'เหลาแหลมพร้อมลุย', '{"nameEn":"Pencil","archetype":"aggro","passive":{"kind":"triggered","name":"ไส้หัก","text":"เมื่อถูกทำลาย: ดาเมจ 1 ใส่ผู้เล่นฝ่ายตรงข้าม","on":"on_destroyed","target":"enemy_player","effect":{"type":"damage","amount":1}},"active":null}', '4', 'normal', 0, 1, 2, 2, '{STATIONERY}', '{}', 0, true),
  ('O02', 'รถแข่งจิ๋ว', 'unit', 'บรื้น ๆ ไม่มีเบรก', '{"nameEn":"Toy Racer","archetype":"aggro","passive":{"kind":"triggered","name":"เร่งเครื่อง","text":"เมื่อโจมตี: +1 ATK เทิร์นนี้","on":"on_attack","target":"self","effect":{"type":"atk","amount":1,"duration":"turn"}},"active":{"name":"เทอร์โบ","text":"+2 ATK เทิร์นนี้ ยังโจมตีได้ แล้วหลับตอนจบเทิร์น (แบตหมด)","target":"self","effect":{"type":"atk","amount":2,"duration":"turn"},"sleepAtEndOfTurn":true}}', '4', 'normal', 0, 3, 2, 3, '{VEHICLE}', '{haste}', 0, true),
  ('O03', 'หนังยาง', 'unit', 'ยืดได้ หดได้ ดีดได้', '{"nameEn":"Rubber Band","archetype":"aggro","passive":null,"active":{"name":"ดีด","text":"ดาเมจ 1 ใส่ศัตรูหรือผู้เล่นฝ่ายตรงข้าม","target":{"pick":"enemy_unit_or_player"},"effect":{"type":"damage","amount":1}}}', '4', 'normal', 0, 2, 1, 2, '{STATIONERY}', '{}', 0, true),
  ('O04', 'จักรยาน', 'unit', 'กริ๊ง ๆ หลีกทางหน่อย', '{"nameEn":"Bicycle","archetype":"aggro","passive":{"kind":"static","name":"ปั่นเป็นขบวน","text":"+1 ATK ถ้ามีพาหนะตัวอื่นฝ่ายเรา","stat":"atk","amount":1,"to":"self","ifAlly":"VEHICLE"},"active":null}', '4', 'normal', 0, 3, 3, 4, '{VEHICLE}', '{haste}', 0, true),
  ('O05', 'กรรไกร', 'unit', 'ฉับ! ทีเดียวขาด', '{"nameEn":"Scissors","archetype":"aggro","passive":null,"active":{"name":"ตัดฉับ","text":"ดาเมจ 2 ใส่ศัตรู 1 ตัว","target":{"pick":"enemy_unit"},"effect":{"type":"damage","amount":2}}}', '4', 'normal', 0, 3, 3, 2, '{STATIONERY,TOOL}', '{piercing}', 0, true),
  ('O06', 'จรวดขวดน้ำ', 'unit', 'สูบลมเต็มที่ ปล่อย!', '{"nameEn":"Bottle Rocket","archetype":"aggro","passive":{"kind":"triggered","name":"จุดชนวน","text":"เมื่อลงสนาม: ดาเมจ 1 ใส่ผู้เล่นฝ่ายตรงข้าม","on":"on_summon","target":"enemy_player","effect":{"type":"damage","amount":1}},"active":{"name":"พุ่งชน","text":"ดาเมจ 2 ใส่ผู้เล่นฝ่ายตรงข้าม","target":"enemy_player","effect":{"type":"damage","amount":2}}}', '4', 'normal', 0, 4, 3, 5, '{VEHICLE}', '{flying}', 0, true),
  ('O07', 'กระเป๋าเป้', 'unit', 'ของจำเป็นอยู่ครบ', '{"nameEn":"Backpack","archetype":"defensive","passive":{"kind":"static","name":"ช่องกันกระแทก","text":"Object อื่นฝ่ายเรา +1 HP","stat":"hp","amount":1,"to":"other_allies"},"active":{"name":"ช่องฉุกเฉิน","text":"ฟื้น 2 HP ให้ Object ฝ่ายเรา 1 ตัว","target":{"pick":"ally"},"effect":{"type":"heal","amount":2}}}', '4', 'normal', 0, 2, 1, 5, '{CONTAINER}', '{guard}', 0, true),
  ('O08', 'กล่องกระดาษ', 'unit', 'ข้างในมีอะไรน้า', '{"nameEn":"Cardboard Box","archetype":"defensive","passive":{"kind":"triggered","name":"ของในกล่อง","text":"เมื่อถูกทำลาย: จั่ว 1 ใบ","on":"on_destroyed","target":"none","effect":{"type":"draw","count":1}},"active":null}', '4', 'normal', 0, 1, 0, 5, '{CONTAINER}', '{guard}', 0, true),
  ('O09', 'ร่ม', 'unit', 'ฝนตกก็ไม่หวั่น', '{"nameEn":"Umbrella","archetype":"defensive","passive":{"kind":"triggered","name":"กางรับฝน","text":"เริ่มเทิร์นเรา: ฟื้น 2 HP ให้ตัวเอง","on":"on_turn_start","target":"self","effect":{"type":"heal","amount":2}},"active":null}', '4', 'normal', 0, 2, 2, 4, '{HOUSEHOLD}', '{guard}', 0, true),
  ('O10', 'กระติกน้ำแข็ง', 'unit', 'เย็นชื่นใจทั้งวัน', '{"nameEn":"Cooler","archetype":"defensive","passive":null,"active":{"name":"ประคบเย็น","text":"ฟื้น 3 HP ให้ Object ฝ่ายเราหรือผู้เล่นเรา","target":{"pick":"ally_or_own_player"},"effect":{"type":"heal","amount":3}}}', '4', 'normal', 0, 3, 2, 6, '{CONTAINER}', '{guard}', 0, true),
  ('O11', 'หมวกกันน็อก', 'unit', 'ปลอดภัยไว้ก่อน', '{"nameEn":"Helmet","archetype":"defensive","passive":null,"active":{"name":"สวมกันกระแทก","text":"Object อื่นฝ่ายเราได้ โล่กำบัง จนถึงเทิร์นถัดไปของเรา","target":{"pick":"ally","other":true},"effect":{"type":"keyword","keyword":"guard","duration":"until_next_turn"}}}', '4', 'normal', 0, 2, 2, 4, '{HOUSEHOLD}', '{}', 0, true),
  ('O12', 'ประตูไม้', 'unit', 'ก๊อก ๆ ไม่เปิดหรอก', '{"nameEn":"Wooden Door","archetype":"defensive","passive":{"kind":"triggered","name":"ปิดบ้าน","text":"เมื่อลงสนาม: ฟื้น 3 HP ให้ผู้เล่นเรา","on":"on_summon","target":"own_player","effect":{"type":"heal","amount":3}},"active":{"name":"ล็อกประตู","text":"ทำให้ศัตรูที่พร้อม 1 ตัวหลับ","target":{"pick":"enemy_unit","readyOnly":true},"effect":{"type":"exhaust"}}}', '4', 'normal', 0, 5, 2, 8, '{HOUSEHOLD}', '{guard}', 0, true),
  ('O13', 'นาฬิกาปลุก', 'unit', 'กริ๊งงง! ตื่นได้แล้ว', '{"nameEn":"Alarm Clock","archetype":"control","passive":{"kind":"triggered","name":"ปลุกเช้า","text":"เมื่อลงสนาม: จั่ว 1 ใบ","on":"on_summon","target":"none","effect":{"type":"draw","count":1}},"active":{"name":"เลื่อนปลุก","text":"ทำให้ศัตรูที่พร้อม 1 ตัวหลับ","target":{"pick":"enemy_unit","readyOnly":true},"effect":{"type":"exhaust"}}}', '4', 'normal', 0, 3, 2, 3, '{ELECTRONIC}', '{}', 0, true),
  ('O14', 'ยางลบ', 'unit', 'ผิดตรงไหน ลบตรงนั้น', '{"nameEn":"Eraser","archetype":"control","passive":null,"active":{"name":"ลบทิ้ง","text":"ดาเมจ 3 ใส่ศัตรู 1 ตัว","target":{"pick":"enemy_unit"},"effect":{"type":"damage","amount":3}}}', '4', 'normal', 0, 4, 2, 6, '{STATIONERY}', '{}', 0, true),
  ('O15', 'ไฟฉาย', 'unit', 'ส่องเห็นทุกซอกมุม', '{"nameEn":"Flashlight","archetype":"control","passive":{"kind":"triggered","name":"แสงจ้า","text":"เมื่อลงสนาม: ดาเมจ 1 ใส่ศัตรูทุกตัว","on":"on_summon","target":"all_enemies","effect":{"type":"damage","amount":1}},"active":null}', '4', 'normal', 0, 3, 2, 3, '{ELECTRONIC}', '{}', 0, true),
  ('O16', 'กาวน้ำ', 'unit', 'ติดแล้วติดเลย', '{"nameEn":"Glue","archetype":"control","passive":null,"active":{"name":"ติดหนึบ","text":"ศัตรู 1 ตัว −2 ATK จนถึงเทิร์นถัดไปของเรา","target":{"pick":"enemy_unit"},"effect":{"type":"atk","amount":-2,"duration":"until_next_turn"}}}', '4', 'normal', 0, 2, 1, 4, '{STATIONERY}', '{}', 0, true),
  ('O17', 'เครื่องดูดฝุ่น', 'unit', 'วู้ววว สะอาดเกลี้ยง', '{"nameEn":"Vacuum","archetype":"control","passive":{"kind":"triggered","name":"ดูดพลัง","text":"เมื่อลงสนาม: ศัตรูทุกตัว −1 ATK จนถึงเทิร์นถัดไปของเรา","on":"on_summon","target":"all_enemies","effect":{"type":"atk","amount":-1,"duration":"until_next_turn"}},"active":{"name":"ดูดแรง","text":"ดาเมจ 2 ใส่ศัตรู 1 ตัว","target":{"pick":"enemy_unit"},"effect":{"type":"damage","amount":2}}}', '4', 'normal', 0, 6, 5, 7, '{ELECTRONIC,HOUSEHOLD}', '{}', 0, true),
  ('O18', 'วิทยุ', 'unit', 'คลื่นข่าวดีทุกเช้า', '{"nameEn":"Radio","archetype":"control","passive":{"kind":"triggered","name":"ข่าวต้นชั่วโมง","text":"เริ่มเทิร์นเรา: จั่ว 1 ใบ","on":"on_turn_start","target":"none","effect":{"type":"draw","count":1}},"active":null}', '4', 'normal', 0, 3, 1, 4, '{ELECTRONIC}', '{}', 0, true),
  ('O19', 'กล่องดินสอ', 'unit', 'เครื่องเขียนรวมพลัง', '{"nameEn":"Pencil Case","archetype":"synergy","passive":{"kind":"static","name":"เก็บครบชุด","text":"เครื่องเขียนตัวอื่นฝ่ายเรา +1 ATK","stat":"atk","amount":1,"to":"other_allies","trait":"STATIONERY"},"active":null}', '4', 'normal', 0, 2, 1, 4, '{CONTAINER,STATIONERY}', '{}', 0, true),
  ('O20', 'ปลั๊กพ่วง', 'unit', 'เสียบปุ๊บ ไฟมาปั๊บ', '{"nameEn":"Power Strip","archetype":"synergy","passive":null,"active":{"name":"จ่ายไฟ","text":"เครื่องไฟฟ้าตัวอื่นฝ่ายเราที่หลับ ตื่นกลับมาพร้อม","target":{"pick":"ally","other":true,"trait":"ELECTRONIC","exhaustedOnly":true},"effect":{"type":"ready"}}}', '4', 'normal', 0, 3, 1, 4, '{ELECTRONIC}', '{}', 0, true),
  ('O21', 'ประแจ', 'unit', 'หลวมตรงไหน ขันให้', '{"nameEn":"Wrench","archetype":"synergy","passive":{"kind":"triggered","name":"หยิบเครื่องมือ","text":"เมื่อลงสนาม: ค้นหาเครื่องมือ 1 ใบจากเด็คขึ้นมือ","on":"on_summon","target":"none","effect":{"type":"search","trait":"TOOL"}},"active":{"name":"ขันแน่น","text":"Object ฝ่ายเรา 1 ตัว +2 HP ถาวร","target":{"pick":"ally"},"effect":{"type":"max_hp","amount":2}}}', '4', 'normal', 0, 3, 2, 3, '{TOOL}', '{}', 0, true),
  ('O22', 'ค้อน', 'unit', 'ตอกทีเดียวอยู่', '{"nameEn":"Hammer","archetype":"synergy","passive":{"kind":"static","name":"ทีมช่าง","text":"+1 ATK ต่อเครื่องมือตัวอื่นฝ่ายเรา","stat":"atk","amount":1,"to":"self","perAlly":"TOOL"},"active":null}', '4', 'normal', 0, 3, 3, 4, '{TOOL}', '{}', 0, true),
  ('O23', 'ไขควง', 'unit', 'หมุนแน่น ไขลึก', '{"nameEn":"Screwdriver","archetype":"synergy","passive":null,"active":{"name":"ไขทะลุ","text":"เครื่องมือตัวอื่นฝ่ายเราได้ เจาะทะลุ เทิร์นนี้","target":{"pick":"ally","other":true,"trait":"TOOL"},"effect":{"type":"keyword","keyword":"piercing","duration":"turn"}}}', '4', 'normal', 0, 1, 2, 2, '{TOOL}', '{}', 0, true),
  ('O24', 'รถบรรทุกของเล่น', 'unit', 'ขนได้ทุกอย่าง', '{"nameEn":"Toy Truck","archetype":"synergy","passive":{"kind":"triggered","name":"ขนของ","text":"เมื่อลงสนาม: ค้นหาพาหนะ 1 ใบจากเด็คขึ้นมือ","on":"on_summon","target":"none","effect":{"type":"search","trait":"VEHICLE"}},"active":{"name":"ส่งของ","text":"ฟื้น 2 HP ให้ Object ฝ่ายเราทุกตัว","target":"all_allies","effect":{"type":"heal","amount":2}}}', '4', 'normal', 0, 5, 3, 7, '{VEHICLE}', '{}', 0, true)
on conflict (id) do update set name = excluded.name, description = excluded.description, effect_spec = excluded.effect_spec, ruleset_version = excluded.ruleset_version, rarity = excluded.rarity, cost = excluded.cost, atk = excluded.atk, hp = excluded.hp, traits = excluded.traits, keywords = excluded.keywords, definition_version = 2;

insert into public.deck_templates (id, version, is_active, ruleset_version) values ('starter_v4', 1, true, '4')
on conflict do nothing;

insert into public.deck_template_cards (deck_template_id, deck_template_version, card_definition_id, quantity) values
  ('starter_v4', 1, 'O01', 2),
  ('starter_v4', 1, 'O02', 1),
  ('starter_v4', 1, 'O03', 2),
  ('starter_v4', 1, 'O04', 1),
  ('starter_v4', 1, 'O05', 1),
  ('starter_v4', 1, 'O06', 1),
  ('starter_v4', 1, 'O07', 1),
  ('starter_v4', 1, 'O08', 2),
  ('starter_v4', 1, 'O09', 1),
  ('starter_v4', 1, 'O10', 1),
  ('starter_v4', 1, 'O11', 1),
  ('starter_v4', 1, 'O12', 1),
  ('starter_v4', 1, 'O13', 2),
  ('starter_v4', 1, 'O14', 1),
  ('starter_v4', 1, 'O15', 1),
  ('starter_v4', 1, 'O16', 1),
  ('starter_v4', 1, 'O17', 1),
  ('starter_v4', 1, 'O18', 1),
  ('starter_v4', 1, 'O19', 2),
  ('starter_v4', 1, 'O20', 1),
  ('starter_v4', 1, 'O21', 1),
  ('starter_v4', 1, 'O22', 1),
  ('starter_v4', 1, 'O23', 2),
  ('starter_v4', 1, 'O24', 1)
on conflict (deck_template_id, deck_template_version, card_definition_id) do nothing;
