import { v2 } from "@aummon/game-engine";

/** Thai UI text for ruleset 2 (card names stay English — owner decision 2026-11-20). */
export const KEYWORD_LABEL: Record<v2.Keyword, string> = {
  haste: "Haste",
  guard: "Guard",
  flying: "Flying",
  piercing: "Piercing",
  boost: "Boost",
};

export const KEYWORD_HELP: Record<v2.Keyword, string> = {
  haste: "โจมตีได้ทันทีในเทิร์นที่ลง",
  guard: "ต้องถูกโจมตีก่อน",
  flying: "ตัวที่ไม่บินโจมตีไม่ได้",
  piercing: "ดาเมจเกินทะลุเข้าผู้เล่น",
  boost: "จ่าย 1 SPARK: +2 ATK จนจบเทิร์น",
};

export const cardName = (cardId: string): string => {
  try {
    return v2.getCardDefinition(cardId).name;
  } catch {
    return cardId;
  }
};

/** Card rules text for actions and equipment (spec §6.5.4). */
export function cardText(cardId: string): string {
  const def = v2.getCardDefinition(cardId);
  const parts = def.effects.map((fx) => {
    switch (fx.type) {
      case "DRAW_CARD":
        return `จั่ว ${fx.count} ใบ`;
      case "SEARCH_CARD":
        return "ค้นหา Equipment 1 ใบจาก Deck";
      case "RECYCLE_CARD":
        return "นำ Equipment 1 ใบจาก Discard ขึ้นมือ";
      case "ADD_KEYWORD":
        return `มอบ ${KEYWORD_LABEL[fx.keyword]}`;
      case "MODIFY_STAT":
        return `+${fx.amount} ${fx.stat.toUpperCase()}`;
      case "MODIFY_COST":
        return "ค่า Evolution −1";
      case "ATTACH_EQUIPMENT":
        return "ติด Equipment ได้ทุกแบบ";
    }
  });
  const traits = def.compatibility?.anyOfTraits ?? [];
  if (def.cardType === "equipment")
    parts.push(traits.length ? `ติดกับ ${traits.join("/")}` : "ติดได้ทุก Unit");
  return parts.join(" · ");
}

const PHASE: Record<string, string> = {
  mulligan: "Mulligan",
  main: "Main Phase",
  battle: "Battle Phase",
};
export const phaseLabel = (view: v2.PlayerView): string =>
  view.status === "mulligan" ? (PHASE["mulligan"] ?? "") : (PHASE[view.phase] ?? view.phase);

type Names = readonly [string, string];

/** One line per public event; never reveals hidden cards (draw events carry no card id). */
export function describeEvent(e: v2.GameEvent, names: Names): string | null {
  const who = (s: v2.Seat) => names[s];
  switch (e.type) {
    case "turn_started":
      return `— เทิร์น ${e.turn}: ${who(e.seat)} (SPARK ${e.spark}) —`;
    case "card_drawn":
      return null;
    case "card_burned":
      return `${who(e.seat)} มือเต็ม: ${cardName(e.cardId)} ลง Discard`;
    case "fatigue":
      return `${who(e.seat)} Deck หมด เสีย ${e.damage} HP`;
    case "mulligan":
      return `${who(e.seat)} เปลี่ยนการ์ด ${e.count} ใบ`;
    case "unit_summoned":
      return `${who(e.seat)} ลง ${cardName(e.cardId)}`;
    case "boosted":
      return `${who(e.seat)} ใช้ Boost`;
    case "attacked":
      return e.target === "player"
        ? `${who(e.seat)} โจมตีผู้เล่น ${e.damageDealt} ดาเมจ`
        : `${who(e.seat)} โจมตี Unit (${e.damageDealt}/${e.damageTaken})${e.piercing ? ` · ทะลุ ${e.piercing}` : ""}`;
    case "unit_destroyed":
      return `Unit ของ ${who(e.seat)} ถูกทำลาย`;
    case "action_played":
      return `${who(e.seat)} ใช้ ${cardName(e.cardId)}`;
    case "card_searched":
      return `${who(e.seat)} ค้นหาได้ ${cardName(e.cardId)}`;
    case "card_recycled":
      return `${who(e.seat)} นำ ${cardName(e.cardId)} กลับขึ้นมือ`;
    case "equipment_attached":
      return `${who(e.seat)} ติด ${cardName(e.cardId)}`;
    case "unit_evolved":
      return `${who(e.seat)}: ${cardName(e.fromCardId)} → ${cardName(e.toCardId)}`;
    case "unit_fused":
      return `${who(e.seat)} Fusion → ${cardName(e.cardId)}`;
    case "turn_ended":
      return null;
    case "forfeit":
      return `${who(e.seat)} ยอมแพ้`;
    case "match_ended":
      return "draw" in e.result ? "จบเกม: เสมอ" : `จบเกม: ${who(e.result.winner)} ชนะ`;
  }
}

/** Button label for a legal command (target names resolved from the view). */
export function commandLabel(c: v2.LegalCommand, view: v2.PlayerView, selected?: string): string {
  const unitName = (id: string) => {
    for (const p of view.players) {
      const u = p.units.find((x) => x.instanceId === id);
      if (u) return cardName(u.cardId);
    }
    return id;
  };
  switch (c.type) {
    case "mulligan":
      return "ยืนยันมือ";
    case "summon":
      return "ลงสนาม";
    case "boost":
      return "Boost +2 ATK (1 SPARK)";
    case "attack":
      return c.target === "player" ? "⚔️ โจมตีผู้เล่น" : `⚔️ โจมตี ${unitName(c.target)}`;
    case "play_action":
      if (c.choice === undefined) return "ใช้การ์ด";
      return `ใช้: ${/^E\d{3}$/.test(c.choice) ? cardName(c.choice) : discardName(c.choice, view)}`;
    case "attach":
      return `ติดให้ ${unitName(c.unitId)}`;
    case "evolve":
      return "✨ Evolution";
    case "fuse":
      return `🔗 Fusion กับ ${unitName(c.unitIds[0] === selected ? c.unitIds[1] : c.unitIds[0])}`;
    case "end_turn":
      return "จบเทิร์น";
  }
}

function discardName(instanceId: string, view: v2.PlayerView): string {
  for (const p of view.players) {
    const c = p.discard.find((x) => x.instanceId === instanceId);
    if (c) return cardName(c.cardId);
  }
  return instanceId;
}

/** Instances a legal command "belongs to" (what the player taps first). */
export function commandSubjects(c: v2.LegalCommand): string[] {
  switch (c.type) {
    case "summon":
    case "boost":
    case "play_action":
    case "attach":
      return [c.instanceId];
    case "attack":
      return [c.attackerId];
    case "evolve":
      return [c.unitId];
    case "fuse":
      return [...c.unitIds];
    default:
      return [];
  }
}
