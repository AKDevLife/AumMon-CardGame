import { v6 } from "@aummon/game-engine";

/**
 * Cards ordered by SPARK cost, cheapest first (owner request), then by `tie` (lower first),
 * then by card id so the order is stable.
 */
export function sortByCost<T extends { cardId: string }>(
  cards: readonly T[],
  tie: (c: T) => number = () => 0,
): T[] {
  const cost = (c: T) => v6.getCardDefinition(c.cardId).cost;
  return [...cards].sort(
    (a, b) => cost(a) - cost(b) || tie(a) - tie(b) || a.cardId.localeCompare(b.cardId),
  );
}
