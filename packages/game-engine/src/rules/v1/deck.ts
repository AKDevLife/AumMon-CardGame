import { handOf } from "../../domain/state.ts";
import type { CardInstanceId, GameState, PlayerId, RandomSource } from "../../domain/types.ts";
import { RULESET_V1 } from "./constants.ts";

/** Fisher–Yates shuffle using the injected RNG. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: RandomSource): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

export type DrawOutcome = "drawn" | "hand_full" | "no_cards";

/**
 * Draw one card for a player (mutates `state`, which must be an engine-owned copy).
 * Rule 7: skip when hand is full. Rule 8: reshuffle discard into an empty deck;
 * if both are empty, skip without error.
 */
export function drawCard(state: GameState, playerId: PlayerId, rng: RandomSource): DrawOutcome {
  const hand = handOf(state, playerId);
  if (hand.length >= RULESET_V1.maxHand) return "hand_full";
  if (state.deck.length === 0) {
    if (state.discard.length === 0) return "no_cards";
    state.deck = shuffle(state.discard, rng);
    state.discard = [];
  }
  const card = state.deck.shift();
  if (card === undefined) return "no_cards";
  hand.push(card);
  return "drawn";
}

/** Move a card from a player's hand to the discard pile (clarification Q8). */
export function discardFromHand(
  state: GameState,
  playerId: PlayerId,
  cardId: CardInstanceId,
): void {
  const hand = handOf(state, playerId);
  const index = hand.indexOf(cardId);
  if (index === -1) throw new Error(`Card ${cardId} is not in ${playerId}'s hand`);
  hand.splice(index, 1);
  state.discard.push(cardId);
}

/** Total cards across deck, discard and hands — must always equal the deck size. */
export function countCards(state: GameState): number {
  return (
    state.deck.length +
    state.discard.length +
    Object.values(state.hands).reduce((sum, hand) => sum + hand.length, 0)
  );
}
