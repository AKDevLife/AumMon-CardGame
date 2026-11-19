import type { CardInstanceId, GameState, PlayerId, PlayerState } from "./types.ts";

/** Deep copy so engine operations never mutate caller-owned state. */
export function cloneState(state: GameState): GameState {
  return {
    ...state,
    result: { ...state.result },
    players: state.players.map((p) => ({ ...p, skillState: { ...p.skillState } })),
    cards: { ...state.cards },
    deck: [...state.deck],
    discard: [...state.discard],
    hands: Object.fromEntries(Object.entries(state.hands).map(([id, h]) => [id, [...h]])),
    submissions: Object.fromEntries(
      Object.entries(state.submissions).map(([id, s]) => [id, { ...s }]),
    ),
  };
}

export function getPlayer(state: GameState, playerId: PlayerId): PlayerState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`Unknown player ${playerId}`);
  return player;
}

export function isAlive(player: PlayerState): boolean {
  return player.status === "alive";
}

/** Rule 1 / Rule 12: speed high→low, ties by lower seat first. */
export function compareTurnOrder(a: PlayerState, b: PlayerState): number {
  return b.speed - a.speed || a.seat - b.seat;
}

export function alivePlayersInTurnOrder(state: GameState): PlayerState[] {
  return state.players.filter(isAlive).sort(compareTurnOrder);
}

export function handOf(state: GameState, playerId: PlayerId): CardInstanceId[] {
  const hand = state.hands[playerId];
  if (!hand) throw new Error(`No hand for player ${playerId}`);
  return hand;
}

/** Narrow a value that the engine's invariants guarantee; throws if violated. */
export function must<T>(value: T | undefined | null, what: string): T {
  if (value === undefined || value === null) throw new Error(`Invariant violated: missing ${what}`);
  return value;
}
