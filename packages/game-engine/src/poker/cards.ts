/** Standard 52-card deck + 7-card hand evaluator (Texas Hold'em). Pure. */
export const RANKS = "23456789TJQKA";
export const SUITS = "cdhs";

/** Card code: rank + suit, e.g. "As", "Td", "2c". */
export type Card = string;

export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) for (const r of RANKS) deck.push(r + s);
  return deck;
}

export const rankOf = (c: Card): number => RANKS.indexOf(c[0] ?? "") + 2;
export const suitOf = (c: Card): string => c[1] ?? "";

export const CATEGORY = [
  "high_card",
  "pair",
  "two_pair",
  "three_of_a_kind",
  "straight",
  "flush",
  "full_house",
  "four_of_a_kind",
  "straight_flush",
] as const;
export type Category = (typeof CATEGORY)[number];

export interface HandValue {
  /** Comparable score: higher wins, equal = split. */
  readonly score: number;
  readonly category: Category;
  /** The best five cards. */
  readonly best: readonly Card[];
}

const encode = (cat: number, kickers: readonly number[]) =>
  kickers.reduce((acc, k) => acc * 15 + k, cat) * 15 ** (5 - kickers.length);

/** Highest card of a five-card straight in unique `ranks`, or 0. Wheel A-2-3-4-5 = 5. */
function straightHigh(ranks: readonly number[]): number {
  const set = new Set(ranks);
  if (set.has(14)) set.add(1);
  for (let hi = 14; hi >= 5; hi--) {
    let ok = true;
    for (let r = hi - 4; r <= hi; r++) if (!set.has(r)) ok = false;
    if (ok) return hi;
  }
  return 0;
}

/** Value of exactly five cards. */
export function evaluate5(cards: readonly Card[]): number {
  const ranks = cards.map(rankOf).sort((a, b) => b - a);
  const flush = cards.every((c) => suitOf(c) === suitOf(cards[0] ?? ""));
  const unique = [...new Set(ranks)];
  const sHigh = unique.length === 5 ? straightHigh(unique) : 0;
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  // Groups sorted by size then rank.
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const g = groups.map(([r]) => r);
  const size = groups.map(([, n]) => n);
  if (flush && sHigh) return encode(8, [sHigh]);
  if (size[0] === 4) return encode(7, g);
  if (size[0] === 3 && size[1] === 2) return encode(6, g);
  if (flush) return encode(5, ranks);
  if (sHigh) return encode(4, [sHigh]);
  if (size[0] === 3) return encode(3, g);
  if (size[0] === 2 && size[1] === 2) return encode(2, g);
  if (size[0] === 2) return encode(1, g);
  return encode(0, ranks);
}

export const categoryOf = (score: number): Category =>
  CATEGORY[Math.floor(score / 15 ** 5)] ?? "high_card";

function combos5(cards: readonly Card[]): Card[][] {
  const out: Card[][] = [];
  const pick = (start: number, acc: Card[]) => {
    if (acc.length === 5) {
      out.push(acc);
      return;
    }
    for (let i = start; i < cards.length; i++) pick(i + 1, [...acc, cards[i] ?? ""]);
  };
  pick(0, []);
  return out;
}

/** Best five of 5–7 cards. */
export function evaluate(cards: readonly Card[]): HandValue {
  if (cards.length < 5 || cards.length > 7) throw new Error("5–7 cards");
  let best = -1;
  let bestCards: Card[] = [];
  for (const five of combos5(cards)) {
    const v = evaluate5(five);
    if (v > best) {
      best = v;
      bestCards = five;
    }
  }
  return { score: best, category: categoryOf(best), best: bestCards };
}
