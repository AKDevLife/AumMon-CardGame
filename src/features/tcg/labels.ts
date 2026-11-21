import { v2 } from "@aummon/game-engine";

/** Thai UI text for ruleset 2 (card names stay English — owner decision 2026-11-20). */
export const KEYWORD_LABEL: Record<v2.Keyword, string> = {
  haste: "โจมตีทันที",
  guard: "โล่กำบัง",
  flying: "บินได้",
  piercing: "เจาะทะลุ",
  boost: "เร่งพลัง",
};

/** Keyword badge style: icon + color token (never color alone). */
export const KEYWORD_STYLE: Record<v2.Keyword, { icon: string; color: string }> = {
  haste: { icon: "💨", color: "var(--color-haste)" },
  guard: { icon: "🛡️", color: "var(--color-guard)" },
  flying: { icon: "🪽", color: "var(--color-flying)" },
  piercing: { icon: "🎯", color: "var(--color-piercing)" },
  boost: { icon: "🔥", color: "var(--color-boost)" },
};

export const KEYWORD_HELP: Record<v2.Keyword, string> = {
  haste: "โจมตีได้ทันทีในเทิร์นที่ลง",
  guard: "ต้องถูกโจมตีก่อน",
  flying: "ตัวที่ไม่บินโจมตีไม่ได้",
  piercing: "ดาเมจเกินทะลุเข้าผู้เล่น",
  boost: "จ่าย 1 พลังงาน: พลังโจมตี +2 จนจบเทิร์น",
};

export const cardName = (cardId: string): string => {
  try {
    return v2.getCardDefinition(cardId).name;
  } catch {
    return cardId;
  }
};

export const TRAIT_LABEL: Record<v2.Trait, string> = {
  TOY: "สายของเล่น",
  METAL: "สายโลหะ",
  PAPER: "สายกระดาษ",
  LIGHT_SOURCE: "สายแสงสว่าง",
  RIDEABLE: "สายพาหนะ",
  CONTAINER: "สายภาชนะ",
  POWER: "สายพลังงาน",
  CLOCKWORK: "สายไขลาน",
  FUSION: "ร่างรวม",
};

/** Card rules text for actions and equipment (spec §6.5.4). */
export function cardText(cardId: string): string {
  const def = v2.getCardDefinition(cardId);
  const parts = def.effects.map((fx) => {
    switch (fx.type) {
      case "DRAW_CARD":
        return `จั่ว ${fx.count} ใบ`;
      case "SEARCH_CARD":
        return "ค้นหาอุปกรณ์ 1 ใบจากกองการ์ด";
      case "RECYCLE_CARD":
        return "นำอุปกรณ์ 1 ใบจากกองทิ้งกลับขึ้นมือ";
      case "ADD_KEYWORD":
        return `มอบ ${KEYWORD_LABEL[fx.keyword]}`;
      case "MODIFY_STAT":
        return `${fx.stat === "atk" ? "พลังโจมตี" : "พลังชีวิต"} +${fx.amount}`;
      case "MODIFY_COST":
        return "ค่าพัฒนาร่างลดลง 1";
      case "ATTACH_EQUIPMENT":
        return "ติดอุปกรณ์ได้ทุกแบบ";
    }
  });
  const traits = def.compatibility?.anyOfTraits ?? [];
  if (def.cardType === "equipment")
    parts.push(traits.length ? `ติดกับ${traits.map((t) => TRAIT_LABEL[t]).join("/")}` : "ติดได้ทุกตัว");
  return parts.join(" · ");
}

const PHASE: Record<string, string> = {
  mulligan: "เลือกเปลี่ยนการ์ดในมือ",
  main: "ช่วงลงการ์ด",
  battle: "ช่วงต่อสู้",
};
export const phaseLabel = (view: v2.PlayerView): string =>
  view.status === "mulligan" ? (PHASE["mulligan"] ?? "") : (PHASE[view.phase] ?? view.phase);

type Names = readonly [string, string];

/** One line per public event; never reveals hidden cards (draw events carry no card id). */
export function describeEvent(e: v2.GameEvent, names: Names): string | null {
  const who = (s: v2.Seat) => names[s];
  switch (e.type) {
    case "turn_started":
      return `— เทิร์น ${e.turn}: ${who(e.seat)} (พลังงาน ${e.spark}) —`;
    case "card_drawn":
      return null;
    case "card_burned":
      return `${who(e.seat)} มือเต็ม: ${cardName(e.cardId)} ลงกองทิ้ง`;
    case "fatigue":
      return `${who(e.seat)} กองการ์ดหมด เสียพลังชีวิต ${e.damage}`;
    case "mulligan":
      return `${who(e.seat)} เปลี่ยนการ์ด ${e.count} ใบ`;
    case "unit_summoned":
      return `${who(e.seat)} ลง ${cardName(e.cardId)}`;
    case "boosted":
      return `${who(e.seat)} ใช้เร่งพลัง`;
    case "attacked":
      return e.target === "player"
        ? `${who(e.seat)} โจมตีผู้เล่น ${e.damageDealt} ดาเมจ`
        : `${who(e.seat)} โจมตีตัวละคร (ทำ ${e.damageDealt} / โดน ${e.damageTaken})${e.piercing ? ` · ทะลุ ${e.piercing}` : ""}`;
    case "unit_destroyed":
      return `ตัวละครของ ${who(e.seat)} ถูกทำลาย`;
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
      return `${who(e.seat)} รวมร่างเป็น ${cardName(e.cardId)}`;
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
      return "เร่งพลัง: พลังโจมตี +2 (ใช้ 1 พลังงาน)";
    case "attack":
      return c.target === "player" ? "⚔️ โจมตีผู้เล่น" : `⚔️ โจมตี ${unitName(c.target)}`;
    case "play_action":
      if (c.choice === undefined) return "ใช้การ์ด";
      return `ใช้: ${/^E\d{3}$/.test(c.choice) ? cardName(c.choice) : discardName(c.choice, view)}`;
    case "attach":
      return `ติดให้ ${unitName(c.unitId)}`;
    case "evolve":
      return "✨ พัฒนาร่าง";
    case "fuse":
      return `🔗 รวมร่างกับ ${unitName(c.unitIds[0] === selected ? c.unitIds[1] : c.unitIds[0])}`;
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

/** History grouped by turn, newest turn first; lines inside a turn stay in play order (owner request). */
export function historyByTurn(events: readonly v2.GameEvent[], names: Names) {
  const groups: { key: string; title: string; lines: string[] }[] = [];
  for (const [i, e] of events.entries()) {
    if (e.type === "turn_started" || groups.length === 0) {
      groups.push({
        key: `g${String(i)}`,
        title: e.type === "turn_started" ? `เทิร์น ${String(e.turn)} · ${names[e.seat]}` : "ก่อนหน้า",
        lines: [],
      });
      if (e.type === "turn_started") continue;
    }
    const line = describeEvent(e, names);
    if (line) groups[groups.length - 1]?.lines.push(line);
  }
  return groups.filter((g) => g.lines.length > 0 || g.title !== "ก่อนหน้า").reverse();
}
