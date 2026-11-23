/** Card codes ("As", "Td", "2c") → Thai labels for Dummy and Poker. */
export const SUIT: Record<string, { glyph: string; name: string; red: boolean }> = {
  c: { glyph: "♣", name: "ดอกจิก", red: false },
  d: { glyph: "♦", name: "ข้าวหลามตัด", red: true },
  h: { glyph: "♥", name: "โพแดง", red: true },
  s: { glyph: "♠", name: "โพดำ", red: false },
};
export const RANK: Record<string, string> = { T: "10", J: "J", Q: "Q", K: "K", A: "A" };

export const cardLabel = (code: string) => {
  const suit = SUIT[code[1] ?? ""];
  const rank = RANK[code[0] ?? ""] ?? code[0] ?? "";
  return `${rank}${suit?.glyph ?? ""}`;
};
