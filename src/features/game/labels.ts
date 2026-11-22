import { discard } from "@aummon/game-engine";

/** Thai UI text for the Casual Discard Edition. */
export const CARD_ART: Record<string, string> = {
  D01: "➰",
  D02: "🧴",
  D03: "🧽",
  D04: "✂️",
  D05: "📦",
  D06: "⏰",
  D07: "🧲",
  D08: "🔍",
  D09: "📏",
  D10: "🩹",
  D11: "🗑️",
  D12: "🔦",
  D13: "🔑",
  D14: "🌀",
  D15: "⏳",
  D16: "☂️",
};

export const cardName = (cardId: string): string => {
  try {
    return discard.getDiscardCard(cardId).name;
  } catch {
    return cardId;
  }
};

const ABILITY_LINE: Partial<Record<discard.AbilityId, string>> = {
  next_draw: "คนถัดไปจั่ว 1 ใบ",
  glue: "ติดกาวผู้เล่น",
  eraser: "ล้างกองกลาง",
  scissors: "ตัดไพ่ใบใต้",
  box: "เก็บไพ่ใบใต้ขึ้นมือ",
  alarm: "สลับทิศ คนถัดไปจั่ว 1",
  magnet: "ส่งไพ่ไปติดคนที่ไพ่น้อยสุด",
  peek: "แอบดูไพ่",
  ruler: "บังคับคนถัดไปลงแต้ม 5",
  tape: "ลงไพ่คู่เพิ่ม",
  trash: "ทิ้งไพ่ 1 ใบแล้วจั่วใหม่",
  flashlight: "เปิดไพ่ทุกคน",
  skip: "ข้ามเทิร์นคนถัดไป",
  fan: "คนไพ่น้อยสุดจั่ว 1",
  hourglass: "ใช้ความสามารถใบก่อนหน้าซ้ำ",
};

type Names = readonly string[];

/** One line per public event (hands stay hidden; private peeks are shown elsewhere). */
export function describeEvent(e: discard.GameEvent, names: Names): string | null {
  const who = (s: number) => names[s] ?? `ผู้เล่น ${String(s + 1)}`;
  switch (e.type) {
    case "game_started":
      return `เริ่มเกม: ${who(e.firstSeat)} เริ่มก่อน · กองกลาง ${cardName(e.top)}`;
    case "played":
      return `${who(e.seat)} ลง ${e.cardIds.map(cardName).join(" + ")}`;
    case "ability":
      return `${who(e.seat)}: ${ABILITY_LINE[e.ability] ?? "ใช้ความสามารถ"}${e.target !== null ? ` → ${who(e.target)}` : ""}`;
    case "drew":
      return e.count > 0 ? `${who(e.seat)} จั่ว ${String(e.count)} ใบ` : null;
    case "passed":
      return `${who(e.seat)} ผ่าน${e.forced ? " (ไม้บรรทัดบังคับ)" : ""}`;
    case "skipped":
      return `${who(e.seat)} ถูกข้ามเทิร์น 🔒`;
    case "pile_reset":
      return `ทุกคนผ่าน — ${who(e.seat)} เริ่มกองใหม่ ลงแต้มไหนก็ได้`;
    case "direction":
      return e.direction === 1 ? "ทิศทาง: ตามเข็มนาฬิกา ↻" : "ทิศทาง: ทวนเข็มนาฬิกา ↺";
    case "umbrella":
      return `${who(e.seat)} กางร่มกัน${e.blocked === "draw" ? "การจั่ว" : "การข้ามเทิร์น"} ☂️`;
    case "card_given":
      return `${who(e.from)} ส่งไพ่ 1 ใบไปติด ${who(e.to)} 🧲`;
    case "removed":
      return `${cardName(e.cardId)} ถูกนำออกจากเกม`;
    case "reveal_all":
      return "ไฟฉายเปิดไพ่ทุกคน 🔦";
    case "peek":
      return `${who(e.seat)} แอบดูไพ่ของ ${who(e.target)} 🔍`;
    case "game_over":
      return `จบเกม: ${who(e.winner)} ชนะ! 🏆`;
    case "timeout":
      return `⏱ ${who(e.seat)} หมดเวลา — ระบบเล่นแทน`;
  }
}

/** History grouped by turn would be noisy for 2–8 players: newest lines first instead. */
export const historyLines = (events: readonly discard.GameEvent[], names: Names): string[] =>
  events
    .flatMap((e) => {
      const line = describeEvent(e, names);
      return line ? [line] : [];
    })
    .reverse();

/** Short center banner for events that matter to the viewer (skips, forced draws, own turn). */
export function bannerFor(
  fresh: readonly discard.GameEvent[],
  me: number | null,
  names: Names,
  myTurnNow: boolean,
): string | null {
  const who = (s: number) => names[s] ?? `ผู้เล่น ${String(s + 1)}`;
  for (const e of [...fresh].reverse()) {
    if (e.type === "game_over") return `🏆 ${who(e.winner)} ชนะ!`;
    if (me === null) continue;
    if (e.type === "timeout" && e.seat === me) return "⏱ หมดเวลา — จั่วให้อัตโนมัติ";
    if (e.type === "skipped" && e.seat === me) return "🔒 คุณถูกข้ามเทิร์น";
    if (e.type === "umbrella" && e.seat === me) return "☂️ กางร่มกันสำเร็จ!";
    if (e.type === "card_given" && e.to === me) return `🧲 ${who(e.from)} ส่งไพ่มาติดคุณ`;
    if (e.type === "ability" && e.target === me && e.seat !== me)
      return `⚡ ${who(e.seat)}: ${ABILITY_LINE[e.ability] ?? "ใช้ความสามารถ"}`;
  }
  if (fresh.some((e) => e.type === "pile_reset")) return "🆕 กองใหม่! ลงแต้มไหนก็ได้";
  if (myTurnNow && fresh.some((e) => e.type === "passed" || e.type === "played")) return "ตาคุณแล้ว!";
  return null;
}
