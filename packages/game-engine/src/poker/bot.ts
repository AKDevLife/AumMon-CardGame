import type { RandomSource } from "../rng/seeded-random.ts";
import { evaluate, rankOf, suitOf, type Card } from "./cards.ts";
import type { PokerCommand, PokerState } from "./engine.ts";
import { getPokerView } from "./view.ts";

/** Preflop strength 0..1 from the two hole cards (simplified Chen-style). */
export function preflopStrength(hole: readonly Card[]): number {
  const [a, b] = hole.map(rankOf).sort((x, y) => y - x);
  if (a === undefined || b === undefined) return 0;
  let v = a / 14 / 2 + b / 14 / 4;
  if (a === b) v += 0.35 + a / 60;
  if (suitOf(hole[0] ?? "") === suitOf(hole[1] ?? "")) v += 0.06;
  const gap = a - b;
  if (gap === 1) v += 0.05;
  else if (gap > 4) v -= 0.08;
  return Math.max(0, Math.min(1, v));
}

/** Postflop strength 0..1 from the made hand (+ a little for flush / straight draws). */
export function postflopStrength(hole: readonly Card[], board: readonly Card[]): number {
  const cards = [...hole, ...board];
  const v = evaluate(cards);
  const base =
    [0.12, 0.4, 0.62, 0.74, 0.82, 0.86, 0.93, 0.98, 1][
      [
        "high_card",
        "pair",
        "two_pair",
        "three_of_a_kind",
        "straight",
        "flush",
        "full_house",
        "four_of_a_kind",
        "straight_flush",
      ].indexOf(v.category)
    ] ?? 0;
  // A pair that only lives on the board is weak.
  const boardOnly = board.length >= 5 && evaluate(board).category === v.category;
  let draw = 0;
  if (board.length < 5) {
    const suits = new Map<string, number>();
    for (const c of cards) suits.set(suitOf(c), (suits.get(suitOf(c)) ?? 0) + 1);
    if ([...suits.values()].some((k) => k === 4)) draw += 0.15;
  }
  return Math.min(1, (boardOnly ? base * 0.5 : base) + draw);
}

/**
 * Bot decision from the seat's own view only (own hole cards, board, public bets) — it never
 * reads other players' cards or the deck.
 */
export function choosePokerBotCommand(
  s: PokerState,
  seat: number,
  rng: RandomSource,
): PokerCommand {
  const v = getPokerView(s, seat);
  const legal = v.legal;
  if (!legal) return { type: "fold" };
  const strength =
    v.board.length === 0 ? preflopStrength(v.myCards) : postflopStrength(v.myCards, v.board);
  const noise = rng.nextInt(100) / 100;
  const potOdds = legal.toCall / Math.max(1, v.pot + legal.toCall);
  if (legal.canRaise && (strength > 0.75 || (strength > 0.55 && noise > 0.8) || noise > 0.97)) {
    const target = Math.round(
      v.currentBet + Math.max(legal.minTo - v.currentBet, v.pot * (0.5 + strength / 2)),
    );
    const to = Math.max(legal.minTo, Math.min(legal.maxTo, target));
    return to >= legal.maxTo ? { type: "all_in" } : { type: "raise", to };
  }
  if (legal.canCheck) return { type: "check" };
  if (strength >= potOdds + 0.15 || (strength > 0.3 && potOdds < 0.2)) return { type: "call" };
  return { type: "fold" };
}
