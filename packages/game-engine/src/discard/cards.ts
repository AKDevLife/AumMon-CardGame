/**
 * Casual Discard Edition — card data (docs/discard/AumMon_Card_Library.md).
 * Data-driven: the engine resolves abilities by `ability` id, so new cards reuse effects.
 */
export type AbilityId =
  | "next_draw" // หนังยาง: next player draws 1
  | "glue" // กาวน้ำ: chosen player cannot play < 4 on their next turn
  | "eraser" // ยางลบ: wild; clears the pile conditions
  | "scissors" // กรรไกร: remove the card under, play 1 more card
  | "box" // กล่องกระดาษ: also put 1 card of 1–3 points on the pile (ruleset 10)
  | "alarm" // นาฬิกาปลุก: reverse + the next player (new direction) draws 1
  | "magnet" // แม่เหล็ก: give 1 own card to the player with the fewest cards
  | "peek" // แว่นขยาย: secretly see 2 cards of a player, then you may play 1 more (ruleset 10)
  | "ruler" // ไม้บรรทัด: next player must play exactly this value or draw & pass
  | "tape" // เทปกาว: also play 2 cards of equal points
  | "trash" // ถังขยะ: remove 1 own card from the game (ruleset 9: no redraw)
  | "flashlight" // ไฟฉาย: reveal all hands, a chosen player draws 1
  | "skip" // กุญแจ: skip the next player
  | "fan" // พัดลม: the player with the fewest cards (not you) draws 1
  | "hourglass" // นาฬิกาทราย: repeat the ability of the card under it
  | "umbrella"; // ร่ม: reaction — cancel a draw / skip aimed at you

export interface DiscardCard {
  readonly cardId: string;
  readonly name: string;
  readonly nameEn: string;
  readonly points: number;
  readonly ability: AbilityId;
  readonly abilityName: string;
  readonly text: string;
  /** One-line text shown on small cards (same meaning as `text`). */
  readonly short: string;
  /** Needs a chosen opponent seat when the ability is used. */
  readonly needsTarget: boolean;
}

const c = (
  cardId: string,
  name: string,
  nameEn: string,
  points: number,
  ability: AbilityId,
  abilityName: string,
  text: string,
  needsTarget = false,
): DiscardCard => ({
  cardId,
  name,
  nameEn,
  points,
  ability,
  abilityName,
  text,
  short: SHORT[ability],
  needsTarget,
});

/** One-line card texts (Rule Simplification S2; same meaning as the full text). */
const SHORT: Record<AbilityId, string> = {
  next_draw: "คนถัดไปจั่ว 1",
  glue: "เลือก 1 คน ห้ามลงแต้ม 1–3 เทิร์นหน้า",
  eraser: "ลงทับได้ทุกใบ ล้างกอง",
  scissors: "ตัดใบใต้ทิ้ง ลงเพิ่มได้ 1",
  box: "วางไพ่แต้ม 1–3 เพิ่มได้ 1 ใบ",
  alarm: "สลับทิศ คนถัดไปจั่ว 1",
  magnet: "ส่ง 1 ใบให้คนไพ่น้อยสุด",
  peek: "แอบดู 2 ใบ แล้วลงเพิ่มได้ 1",
  ruler: "คนถัดไปต้องลงแต้ม 5",
  tape: "ลงคู่แต้มเท่ากันเพิ่ม 2 ใบ",
  trash: "ทิ้ง 1 ใบออกจากเกม",
  flashlight: "เปิดไพ่ทุกคน เลือก 1 คนจั่ว",
  skip: "ข้ามคนถัดไป 1 เทิร์น",
  fan: "คนไพ่น้อยสุดจั่ว 1",
  hourglass: "ใช้พลังใบใต้ซ้ำ",
  umbrella: "กันจั่ว/โดนข้าม นอกเทิร์นได้",
};

export const DISCARD_CARDS: readonly DiscardCard[] = [
  c("D01", "หนังยาง", "Rubber Band", 2, "next_draw", "ดีด", "ผู้เล่นคนถัดไปจั่วเพิ่ม 1 ใบ"),
  c("D02", "กาวน้ำ", "Glue", 3, "glue", "ติดหนึบ", "เลือกผู้เล่น 1 คน เทิร์นถัดไปของเขาห้ามลงไพ่แต้ม 1–3", true),
  c(
    "D03",
    "ยางลบ",
    "Eraser",
    1,
    "eraser",
    "ลบเงื่อนไข",
    "ลงทับไพ่ใบไหนก็ได้ ล้างแต้มและเงื่อนไขของกอง คนถัดไปลงไพ่แต้มไหนก็ได้",
  ),
  c(
    "D04",
    "กรรไกร",
    "Scissors",
    4,
    "scissors",
    "ตัด",
    "นำไพ่ใบใต้กรรไกรออกจากเกม แล้วลงไพ่ในมือเพิ่มได้อีก 1 ใบ (ตามกฎแต้ม)",
  ),
  c(
    "D05",
    "กล่องกระดาษ",
    "Cardboard Box",
    3,
    "box",
    "เก็บของ",
    "วางไพ่ในมือที่แต้ม 1–3 ลงบนกองเพิ่มได้อีก 1 ใบ (ไม่ใช้พลังของใบนั้น)",
  ),
  c(
    "D06",
    "นาฬิกาปลุก",
    "Alarm Clock",
    5,
    "alarm",
    "ปลุก",
    "สลับทิศทางการเล่น แล้วผู้เล่นคนถัดไป (ตามทิศใหม่) จั่วเพิ่ม 1 ใบ",
  ),
  c("D07", "แม่เหล็ก", "Magnet", 4, "magnet", "ดูดติด", "ส่งไพ่ 1 ใบจากมือเราไปติดผู้เล่นที่มีไพ่น้อยที่สุด"),
  c(
    "D08",
    "แว่นขยาย",
    "Magnifier",
    2,
    "peek",
    "ส่อง",
    "เลือกผู้เล่น 1 คน ดูไพ่ในมือเขาแบบลับ 2 ใบ แล้วลงไพ่เพิ่มได้อีก 1 ใบ (ตามกฎแต้ม)",
    true,
  ),
  c(
    "D09",
    "ไม้บรรทัด",
    "Ruler",
    5,
    "ruler",
    "ตีเส้น",
    "ผู้เล่นคนถัดไปต้องลงไพ่แต้ม 5 เท่านั้น ไม่งั้นจั่ว 1 ใบและผ่าน",
  ),
  c("D10", "เทปกาว", "Tape", 6, "tape", "แปะคู่", "ลงไพ่ 2 ใบที่แต้มเท่ากันเพิ่มได้ทันที"),
  c("D11", "ถังขยะ", "Trash Can", 1, "trash", "ทิ้งกาก", "ทิ้งไพ่ในมือ 1 ใบออกจากเกม (ไม่ต้องจั่วคืน)"),
  c(
    "D12",
    "ไฟฉาย",
    "Flashlight",
    6,
    "flashlight",
    "ส่องสว่าง",
    "เปิดไพ่ในมือทุกคนให้ทุกคนเห็น แล้วเลือกผู้เล่น 1 คนจั่วเพิ่ม 1 ใบ",
    true,
  ),
  c("D13", "กุญแจ", "Key", 6, "skip", "ล็อก", "ข้ามเทิร์นของผู้เล่นคนถัดไป 1 เทิร์น"),
  c("D14", "พัดลม", "Fan", 4, "fan", "เป่า", "ผู้เล่นที่มีไพ่น้อยที่สุด (ไม่นับเรา) จั่วเพิ่ม 1 ใบ"),
  c(
    "D15",
    "นาฬิกาทราย",
    "Hourglass",
    3,
    "hourglass",
    "ย้อนเวลา",
    "ใช้ความสามารถของไพ่ใบก่อนหน้า (ใบใต้นาฬิกาทราย) ซ้ำอีกครั้ง",
  ),
  c(
    "D16",
    "ร่ม",
    "Umbrella",
    7,
    "umbrella",
    "กางกัน",
    "ลงสวนนอกเทิร์นได้ เมื่อถูกบังคับจั่วหรือข้ามเทิร์น ยกเลิกผลนั้นกับเรา",
  ),
];

export const DISCARD_RULES = {
  version: "11",
  minPlayers: 2,
  maxPlayers: 8,
  copies: 4,
  handSmall: 7, // 2–4 players (ruleset 11, owner 2026-11-22)
  handLarge: 5, // 5–8 players
  turnTimeoutMs: 60_000, // ruleset 11 (owner): 60 s per turn
  reactionTimeoutMs: 5_000,
  /** Draw Then Play: the decision on a drawn card gets at least this much time. */
  drawnDecisionMinMs: 5_000,
  /** Online: consecutive timeouts before the seat is auto-played (QM4). */
  afkTimeouts: 2,
} as const;

const BY_ID = new Map(DISCARD_CARDS.map((x) => [x.cardId, x]));

export function getDiscardCard(cardId: string): DiscardCard {
  const card = BY_ID.get(cardId);
  if (!card) throw new Error(`Unknown card: ${cardId}`);
  return card;
}
