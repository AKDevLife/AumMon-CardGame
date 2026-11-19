/**
 * Client-safe view (blueprint §5.3). Built field-by-field from an allow-list —
 * never spread the full GameState. Deck order, other hands, submissions
 * contents and skill state are never included.
 */
import type {
  CardType,
  GameEvent,
  GamePhase,
  GameState,
  MatchResult,
  PlayerId,
  PlayerStatus,
} from "../domain/types.ts";

export interface PublicPlayerView {
  id: string;
  seat: number;
  displayName: string;
  characterId: string;
  hp: number;
  maxHp: number;
  status: PlayerStatus;
  hasSubmitted: boolean;
}

export interface HandCardView {
  instanceId: string;
  definitionId: string;
  type: CardType;
  name: string;
}

export interface PlayerGameView {
  matchId: string;
  phase: GamePhase;
  round: number;
  version: number;
  players: PublicPlayerView[];
  myHand: HandCardView[];
  events: GameEvent[];
  result: MatchResult;
}

export function buildPlayerView(
  state: GameState,
  viewerId: PlayerId | null,
  events: GameEvent[] = [],
): PlayerGameView {
  const hand = viewerId ? (state.hands[viewerId] ?? []) : [];
  return {
    matchId: state.matchId,
    phase: state.phase,
    round: state.round,
    version: state.version,
    players: state.players.map((p) => ({
      id: p.id,
      seat: p.seat,
      displayName: p.displayName,
      characterId: p.characterId,
      hp: p.hp,
      maxHp: p.maxHp,
      status: p.status,
      hasSubmitted: state.submissions[p.id] !== undefined,
    })),
    myHand: hand.flatMap((id) => {
      const card = state.cards[id];
      return card
        ? [
            {
              instanceId: card.id,
              definitionId: card.definitionId,
              type: card.type,
              name: card.name,
            },
          ]
        : [];
    }),
    events: events.map((e) => ({
      type: e.type,
      round: e.round,
      publicPayload: { ...e.publicPayload },
    })),
    result: { ...state.result },
  };
}
