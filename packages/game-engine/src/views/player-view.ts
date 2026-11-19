/**
 * Client-safe view contracts from aummon_project_blueprint.md section 5.3.
 *
 * Never send the full GameState, deck order, other players' hands or private
 * skill state to a client. The view builder (Phase 3) must construct these
 * objects field by field from an allow-list.
 */
import type { CardType, GameEvent, GamePhase, PlayerStatus } from "../domain/types.ts";

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
}
