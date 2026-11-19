import type { CardEffect, GameState, SubmitActionCommand } from "../src/domain/types.ts";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import { initializeMatch } from "../src/rules/v1/setup.ts";
import { matchInput } from "./fixtures.ts";

export const rng = (seed = 7) => createSeededRandom([seed, 2, 3, 4]);

/**
 * Build a select-phase state with exact hands. `hands[i]` lists card effects for player i.
 * Card ids come from the real 40-card deck so conservation still holds.
 */
export function selectState(
  characterIds: string[],
  hands: CardEffect[][],
  overrides: Partial<Record<number, { hp?: number }>> = {},
): GameState {
  const state = initializeMatch(matchInput(characterIds), rng()).state;
  const pool = [...state.deck, ...Object.values(state.hands).flat()];
  state.deck = pool;
  for (const p of state.players) state.hands[p.id] = [];
  state.players.forEach((p, i) => {
    for (const effect of hands[i] ?? []) {
      const index = state.deck.findIndex((id) => state.cards[id]?.effect === effect);
      if (index === -1) throw new Error(`no ${effect} card left`);
      state.hands[p.id]?.push(...state.deck.splice(index, 1));
    }
    const o = overrides[i];
    if (o?.hp !== undefined) p.hp = o.hp;
  });
  state.phase = "select";
  state.round = 1;
  return state;
}

export function cardOf(state: GameState, playerId: string, effect: CardEffect): string {
  const id = state.hands[playerId]?.find((c) => state.cards[c]?.effect === effect);
  if (!id) throw new Error(`${playerId} has no ${effect}`);
  return id;
}

export function command(
  state: GameState,
  playerId: string,
  effect: CardEffect,
  extra: { targetPlayerId?: string; choice?: string } = {},
): SubmitActionCommand {
  return {
    matchId: state.matchId,
    roundNumber: state.round,
    expectedVersion: state.version,
    cardInstanceId: cardOf(state, playerId, effect),
    idempotencyKey: `${playerId}-${state.round}`,
    ...extra,
  };
}
