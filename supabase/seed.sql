-- AumMon seed data (task 2.5) — aummon_game_spec.md §2, §3, Rule 8; clarification Q1 (chaos 2/2/2).
-- Idempotent: safe to re-run. Definitions are versioned; change values via a new definition_version.

insert into public.characters (id, name, element, base_hp, speed, hook, effect_key, description) values
  ('pyro_pup', 'ปิโร่ ลูกหมาไฟ', 'fire', 3, 70, 'onAttack', 'BONUS_DMG_FIRST_HIT',
   'การโจมตีที่เข้าเป้าและไม่ถูกหลบ/ป้องกัน 100% ครั้งแรกในรอบ +1 ดาเมจ'),
  ('aqua_otter', 'อควา นากน้อยสายน้ำ', 'water', 3, 60, 'onTurnStart', 'SWAP_CARD_ONCE',
   '1 ครั้ง/เกม ในช่วงเริ่มเทิร์น (ก่อน Select) สลับการ์ดบนมือแบบสุ่ม 1 ใบกับผู้เล่นที่ยังรอดชีวิต'),
  ('breeze_kit', 'บรีซ ลูกจิ้งจอกลม', 'wind', 3, 90, 'onBeforeDamaged', 'DISCARD_TO_DODGE',
   'ทิ้งการ์ดแบบสุ่มบนมือ 1 ใบเพื่อหลบดาเมจทั้งหมดจาก Hit นั้น (1 ครั้งต่อ Hit)'),
  ('terra_tortoise', 'เทอร์ร่า เต่าหินจอมอึด', 'earth', 4, 40, 'onBeforeDamaged', 'REDUCE_DMG_1',
   'เริ่ม 4 HP และลดดาเมจที่ได้รับในแต่ละ Hit ลง 1 หน่วย (ต่ำสุด 0)')
on conflict (id) do nothing;

insert into public.card_definitions (id, name, card_type, description, effect_spec) values
  ('attack', 'Attack', 'attack', 'ทำดาเมจ 1 หน่วยต่อเป้าหมายที่เลือก 1 คน',
   '{"effect":"damage","amount":1,"target":"single_opponent"}'),
  ('defense', 'Defense', 'defense', 'โล่ป้องกันดาเมจรวม 1 หน่วยตลอดทั้งรอบ',
   '{"effect":"shield","amount":1,"duration":"round","target":"self"}'),
  ('support', 'Support', 'support', 'เลือกฟื้น HP 1 หน่วย (ไม่เกิน maxHp) หรือจั่วการ์ด 1 ใบ',
   '{"effect":"support","choices":["heal","draw"],"amount":1,"target":"self"}'),
  ('chaos_redirect', 'Chaos: Redirect', 'chaos', 'Action เป้าหมายเดี่ยวที่เล็งมาที่เรารอบนี้ เปลี่ยนไปโดนเป้าหมายที่เลือก',
   '{"effect":"redirect","duration":"round","target":"single_opponent"}'),
  ('chaos_aoe', 'Chaos: AoE', 'chaos', 'ทำดาเมจ 1 หน่วยใส่ผู้เล่นอื่นทุกคนที่ยังมีชีวิต',
   '{"effect":"aoe","amount":1,"target":"all_opponents"}'),
  ('chaos_disrupt', 'Chaos: Disrupt', 'chaos', 'บังคับผู้เล่นเป้าหมายทิ้งการ์ดแบบสุ่ม 1 ใบ',
   '{"effect":"disrupt","amount":1,"target":"single_opponent"}')
on conflict (id) do nothing;

insert into public.deck_templates (id, version, is_active) values ('standard', 1, true)
on conflict (id, version) do nothing;

insert into public.deck_template_cards (deck_template_id, deck_template_version, card_definition_id, quantity) values
  ('standard', 1, 'attack', 16),
  ('standard', 1, 'defense', 10),
  ('standard', 1, 'support', 8),
  ('standard', 1, 'chaos_redirect', 2),
  ('standard', 1, 'chaos_aoe', 2),
  ('standard', 1, 'chaos_disrupt', 2)
on conflict (deck_template_id, deck_template_version, card_definition_id) do nothing;

-- ---------------------------------------------------------------- ruleset 2 (task 8.9)
-- Mirrors packages/game-engine/src/rules/v2 (spec §6.5.4, §1.5); drift is caught by tests/v2-seed.test.ts.

insert into public.card_definitions (id, name, card_type, description, effect_spec, ruleset_version, rarity, stage, cost, atk, hp, traits, keywords, slot_cost, deckable) values
  ('U001_RUBBER_DUCKLING', 'Rubber Duckling', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'normal', 0, 1, 2, 3, '{TOY}', '{haste}', 0, true),
  ('U002_TIN_CAN_GUARDIAN', 'Tin Can Guardian', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'normal', 0, 1, 1, 4, '{METAL}', '{guard}', 0, true),
  ('U003_PAPER_GLIDER', 'Paper Glider', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'normal', 0, 1, 2, 2, '{PAPER}', '{flying}', 0, true),
  ('U004_POCKET_FLASHLIGHT', 'Pocket Flashlight', 'unit', '', '{"effects":[{"type":"MODIFY_COST","scope":"own_evolution","amount":-1}],"compatibility":null}', '2', 'normal', 0, 2, 2, 4, '{LIGHT_SOURCE}', '{}', 0, true),
  ('U005_MINI_SKATEBOARD', 'Mini Skateboard', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'normal', 0, 2, 3, 3, '{RIDEABLE}', '{boost}', 0, true),
  ('U006_THERMOS_GOLEM', 'Thermos Golem', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'normal', 0, 2, 2, 5, '{CONTAINER,METAL}', '{guard}', 0, true),
  ('U007_BATTERY_BUDDY', 'Battery Buddy', 'unit', '', '{"effects":[{"type":"ATTACH_EQUIPMENT","scope":"any_compatibility"}],"compatibility":null}', '2', 'normal', 0, 2, 2, 4, '{POWER}', '{}', 0, true),
  ('U008_WINDUP_ROBOT', 'Wind-up Robot', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'normal', 0, 2, 3, 3, '{CLOCKWORK}', '{haste}', 0, true),
  ('U101_TURBO_BATH_DUCK', 'Turbo Bath Duck', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'rare', 1, 2, 4, 5, '{TOY}', '{haste,piercing}', 0, false),
  ('U102_STEEL_CAN_BASTION', 'Steel Can Bastion', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'rare', 1, 2, 2, 7, '{METAL}', '{guard}', 0, false),
  ('U103_PAPER_JET', 'Paper Jet', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'rare', 1, 2, 4, 4, '{PAPER}', '{flying,piercing}', 0, false),
  ('U104_SOLAR_SEARCHLIGHT', 'Solar Searchlight', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'rare', 1, 2, 3, 6, '{LIGHT_SOURCE}', '{guard}', 0, false),
  ('U105_ROCKET_SKATEBOARD', 'Rocket Skateboard', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'rare', 1, 3, 5, 5, '{RIDEABLE}', '{boost,haste}', 0, false),
  ('U106_PRESSURE_TANK_GOLEM', 'Pressure Tank Golem', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'rare', 1, 3, 3, 8, '{CONTAINER,METAL}', '{guard}', 0, false),
  ('U107_PORTABLE_POWER_HUB', 'Portable Power Hub', 'unit', '', '{"effects":[{"type":"ATTACH_EQUIPMENT","scope":"any_compatibility"}],"compatibility":null}', '2', 'rare', 1, 2, 3, 6, '{POWER}', '{}', 0, false),
  ('U108_OVERWOUND_CLOCKWORK', 'Overwound Clockwork', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'rare', 1, 2, 4, 5, '{CLOCKWORK}', '{haste,piercing}', 0, false),
  ('U201_AMPHIBIOUS_GLIDER', 'Amphibious Glider', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'super_rare', 2, 3, 6, 7, '{FUSION}', '{flying}', 0, false),
  ('U202_FORTRESS_KETTLE', 'Fortress Kettle', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'super_rare', 2, 4, 4, 9, '{FUSION}', '{}', 0, false),
  ('U203_ELECTRIC_RIDE', 'Electric Ride', 'unit', '', '{"effects":[],"compatibility":null}', '2', 'super_rare', 2, 4, 6, 8, '{FUSION}', '{}', 0, false),
  ('A001', 'Quick Doodle', 'action', '', '{"effects":[{"type":"DRAW_CARD","count":2}],"compatibility":null}', '2', 'normal', 0, 1, 0, 0, '{}', '{}', 0, true),
  ('A002', 'Lost & Found', 'action', '', '{"effects":[{"type":"SEARCH_CARD","cardType":"equipment","count":1}],"compatibility":null}', '2', 'normal', 0, 1, 0, 0, '{}', '{}', 0, true),
  ('A003', 'Scrap Return', 'action', '', '{"effects":[{"type":"RECYCLE_CARD","cardType":"equipment","count":1}],"compatibility":null}', '2', 'normal', 0, 1, 0, 0, '{}', '{}', 0, true),
  ('E001', 'Clip-on Propeller', 'equipment', '', '{"effects":[{"type":"ADD_KEYWORD","keyword":"flying"}],"compatibility":{"anyOfTraits":["TOY","PAPER"]}}', '2', 'normal', 0, 1, 0, 0, '{}', '{}', 1, true),
  ('E002', 'Reinforced Lid', 'equipment', '', '{"effects":[{"type":"MODIFY_STAT","stat":"hp","amount":2}],"compatibility":{"anyOfTraits":["CONTAINER","METAL"]}}', '2', 'normal', 0, 1, 0, 0, '{}', '{}', 1, true),
  ('E003', 'Power Charger', 'equipment', '', '{"effects":[{"type":"MODIFY_STAT","stat":"atk","amount":1}],"compatibility":{"anyOfTraits":[]}}', '2', 'normal', 0, 1, 0, 0, '{}', '{}', 1, true)
on conflict (id) do nothing;

insert into public.evolution_recipes (id, source_card_id, target_card_id, required_stage, required_trait, cost, recipe_version) values
  ('EV-001', 'U001_RUBBER_DUCKLING', 'U101_TURBO_BATH_DUCK', 0, 'TOY', 2, '1.1.0'),
  ('EV-002', 'U002_TIN_CAN_GUARDIAN', 'U102_STEEL_CAN_BASTION', 0, 'METAL', 2, '1.1.0'),
  ('EV-003', 'U003_PAPER_GLIDER', 'U103_PAPER_JET', 0, 'PAPER', 2, '1.1.0'),
  ('EV-004', 'U004_POCKET_FLASHLIGHT', 'U104_SOLAR_SEARCHLIGHT', 0, 'LIGHT_SOURCE', 2, '1.1.0'),
  ('EV-005', 'U005_MINI_SKATEBOARD', 'U105_ROCKET_SKATEBOARD', 0, 'RIDEABLE', 3, '1.1.0'),
  ('EV-006', 'U006_THERMOS_GOLEM', 'U106_PRESSURE_TANK_GOLEM', 0, 'CONTAINER', 3, '1.1.0'),
  ('EV-007', 'U007_BATTERY_BUDDY', 'U107_PORTABLE_POWER_HUB', 0, 'POWER', 2, '1.1.0'),
  ('EV-008', 'U008_WINDUP_ROBOT', 'U108_OVERWOUND_CLOCKWORK', 0, 'CLOCKWORK', 2, '1.1.0')
on conflict (id) do nothing;

insert into public.fusion_recipes (id, parent_a_card_id, parent_b_card_id, result_card_id, cost, inherited_keywords, recipe_version) values
  ('FU-001', 'U001_RUBBER_DUCKLING', 'U003_PAPER_GLIDER', 'U201_AMPHIBIOUS_GLIDER', 3, '{}', '1.1.0'),
  ('FU-002', 'U002_TIN_CAN_GUARDIAN', 'U006_THERMOS_GOLEM', 'U202_FORTRESS_KETTLE', 4, '{guard}', '1.1.0'),
  ('FU-003', 'U005_MINI_SKATEBOARD', 'U007_BATTERY_BUDDY', 'U203_ELECTRIC_RIDE', 4, '{boost}', '1.1.0')
on conflict (id) do nothing;

insert into public.deck_templates (id, version, is_active, ruleset_version) values ('starter_v2', 1, true, '2')
on conflict (id, version) do nothing;

insert into public.deck_template_cards (deck_template_id, deck_template_version, card_definition_id, quantity) values
  ('starter_v2', 1, 'U001_RUBBER_DUCKLING', 2),
  ('starter_v2', 1, 'U002_TIN_CAN_GUARDIAN', 2),
  ('starter_v2', 1, 'U003_PAPER_GLIDER', 2),
  ('starter_v2', 1, 'U004_POCKET_FLASHLIGHT', 2),
  ('starter_v2', 1, 'U005_MINI_SKATEBOARD', 2),
  ('starter_v2', 1, 'U006_THERMOS_GOLEM', 2),
  ('starter_v2', 1, 'U007_BATTERY_BUDDY', 2),
  ('starter_v2', 1, 'U008_WINDUP_ROBOT', 2),
  ('starter_v2', 1, 'A001', 3),
  ('starter_v2', 1, 'A002', 2),
  ('starter_v2', 1, 'A003', 2),
  ('starter_v2', 1, 'E001', 2),
  ('starter_v2', 1, 'E002', 2),
  ('starter_v2', 1, 'E003', 3)
on conflict (deck_template_id, deck_template_version, card_definition_id) do nothing;
