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
