import { v5 } from "@aummon/game-engine";

/** Thai UI text for ruleset 5 (Everyday Objects Battle). */
export const KEYWORD_LABEL: Record<v5.Keyword, string> = {
  haste: "โจมตีทันที",
  guard: "โล่กำบัง",
  flying: "บินได้",
  piercing: "เจาะทะลุ",
};

/** Keyword badge style: icon + color token (never color alone). */
export const KEYWORD_STYLE: Record<v5.Keyword, { icon: string; color: string }> = {
  haste: { icon: "💨", color: "var(--color-haste)" },
  guard: { icon: "🛡️", color: "var(--color-guard)" },
  flying: { icon: "🪽", color: "var(--color-flying)" },
  piercing: { icon: "🎯", color: "var(--color-piercing)" },
};

export const KEYWORD_HELP: Record<v5.Keyword, string> = {
  haste: "โจมตีได้ทันทีในเทิร์นที่ลง",
  guard: "ต้องถูกโจมตีก่อน ถึงจะโจมตีตัวอื่นหรือผู้เล่นโดยตรงได้ (ทำงานแม้หลับ · ตัวที่มีโล่จะบินไม่ได้)",
  flying: "ตัวที่ไม่บินโจมตีไม่ได้",
  piercing: "ดาเมจเกินทะลุเข้าผู้เล่น",
};

export const TRAIT_LABEL: Record<v5.Trait, string> = {
  STATIONERY: "เครื่องเขียน",
  CONTAINER: "ที่เก็บของ",
  VEHICLE: "พาหนะ",
  ELECTRONIC: "เครื่องไฟฟ้า",
  TOOL: "เครื่องมือ",
  /** Objects that belong to no other category (owner 2026-11-21). */
  FREE: "อิสระ",
};

/** Placeholder "Living Objects" art until real illustrations exist (decision D10). */
export const CARD_ART: Record<string, string> = {
  O01: "✏️",
  O02: "🏎️",
  O03: "➰",
  O04: "🚲",
  O05: "✂️",
  O06: "🚀",
  O07: "🎒",
  O08: "📦",
  O09: "☂️",
  O10: "🧊",
  O11: "⛑️",
  O12: "🚪",
  O13: "⏰",
  O14: "🧽",
  O15: "🔦",
  O16: "🧴",
  O17: "🧹",
  O18: "📻",
  O19: "🖍️",
  O20: "🔌",
  O21: "🔧",
  O22: "🔨",
  O23: "🪛",
  O24: "🚚",
};

export const cardName = (cardId: string): string => {
  try {
    return v5.getCardDefinition(cardId).name;
  } catch {
    return cardId;
  }
};

const PHASE: Record<string, string> = {
  mulligan: "เลือกเปลี่ยนการ์ดในมือ",
  main: "เทิร์นของผู้เล่น",
  battle: "ช่วงต่อสู้",
};
export const phaseLabel = (view: v5.PlayerView): string =>
  view.status === "mulligan" ? (PHASE["mulligan"] ?? "") : (PHASE[view.phase] ?? view.phase);

type Names = readonly [string, string];

function unitNameIn(view: v5.PlayerView | null, id: string): string {
  if (!view) return "ตัวละคร";
  for (const p of view.players) {
    const u = p.units.find((x) => x.instanceId === id);
    if (u) return cardName(u.cardId);
  }
  return "ตัวละคร";
}

/** One line per public event; never reveals hidden cards (draw events carry no card id). */
export function describeEvent(e: v5.GameEvent, names: Names): string | null {
  const who = (s: v5.Seat) => names[s];
  switch (e.type) {
    case "turn_started":
      return `— เทิร์น ${String(e.turn)}: ${who(e.seat)} (พลังงาน ${String(e.spark)}) —`;
    case "card_drawn":
    case "turn_ended":
      return null;
    case "card_burned":
      return `${who(e.seat)} มือเต็ม: ${cardName(e.cardId)} ลงกองทิ้ง`;
    case "fatigue":
      return `${who(e.seat)} กองการ์ดหมด เสียพลังชีวิต ${String(e.damage)}`;
    case "mulligan":
      return `${who(e.seat)} เปลี่ยนการ์ด ${String(e.count)} ใบ`;
    case "unit_summoned":
      return `${who(e.seat)} ลง ${cardName(e.cardId)}`;
    case "attacked":
      return e.target === "player"
        ? `${who(e.seat)} โจมตีผู้เล่น ${String(e.damageDealt)} ดาเมจ`
        : `${who(e.seat)} โจมตีตัวละคร (ทำ ${String(e.damageDealt)} / โดน ${String(e.damageTaken)})${e.piercing ? ` · ทะลุ ${String(e.piercing)}` : ""}`;
    case "unit_destroyed":
      return `${cardName(e.cardId)} ของ ${who(e.seat)} ถูกทำลาย`;
    case "ability_activated": {
      const a = v5.getCardDefinition(e.cardId).active;
      return `${who(e.seat)}: ${cardName(e.cardId)} ใช้ "${a?.name ?? "ความสามารถ"}"`;
    }
    case "ability_triggered": {
      const p = v5.getCardDefinition(e.cardId).passive;
      return `${cardName(e.cardId)} ทำงาน: "${p?.name ?? "ความสามารถ"}"`;
    }
    case "effect_applied":
      return null;
    case "card_searched":
      return `${who(e.seat)} ค้นหาได้ ${cardName(e.cardId)}`;
    case "forfeit":
      return `${who(e.seat)} ยอมแพ้`;
    case "match_ended":
      return "draw" in e.result ? "จบเกม: เสมอ" : `จบเกม: ${who(e.result.winner)} ชนะ`;
  }
}

/** Button label for a legal command (target names resolved from the view). */
export function commandLabel(c: v5.LegalCommand, view: v5.PlayerView): string {
  switch (c.type) {
    case "mulligan":
      return "ยืนยันมือ";
    case "summon":
      return "ลงสนาม";
    case "attack":
      return c.target === "player" ? "⚔️ โจมตีผู้เล่น" : `⚔️ โจมตี ${unitNameIn(view, c.target)}`;
    case "activate": {
      const src = view.players.flatMap((p) => p.units).find((u) => u.instanceId === c.instanceId);
      const a = src ? v5.getCardDefinition(src.cardId).active : null;
      const name = `✨ ${a?.name ?? "ใช้ความสามารถ"}`;
      if (c.target === undefined) return name;
      if (c.target === "player") {
        const own = a && typeof a.target !== "string" && a.target.pick === "ally_or_own_player";
        return `${name} → ${own ? "ผู้เล่นเรา" : "ผู้เล่นฝ่ายตรงข้าม"}`;
      }
      return `${name} → ${unitNameIn(view, c.target)}`;
    }
    case "end_turn":
      return "จบเทิร์น";
  }
}

/** Instances a legal command "belongs to" (what the player taps first). */
export function commandSubjects(c: v5.LegalCommand): string[] {
  switch (c.type) {
    case "summon":
    case "activate":
      return [c.instanceId];
    case "attack":
      return [c.attackerId];
    default:
      return [];
  }
}

/** Unit ids a command points at (green "valid target" ring). */
export function commandTarget(c: v5.LegalCommand): string | null {
  if ((c.type === "attack" || c.type === "activate") && c.target && c.target !== "player")
    return c.target;
  return null;
}

/** History grouped by turn, newest turn first; lines inside a turn stay in play order (owner request). */
export function historyByTurn(events: readonly v5.GameEvent[], names: Names) {
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
