/**
 * Domain contracts from aummon_project_blueprint.md section 5.2.
 *
 * Phase 1 scope: type contracts only. Rule logic arrives in Phase 3.
 */

export type PlayerId = string;
export type CardInstanceId = string;

export type CardType = "attack" | "defense" | "support" | "chaos";

export type CharacterHook =
  "onTurnStart" | "onAttack" | "onBeforeDamaged" | "onAfterDamaged" | "onRoundEnd";

export type GamePhase = "setup" | "draw" | "select" | "resolving" | "end";

export type PlayerStatus = "alive" | "eliminated" | "surrendered";

export interface CharacterDefinition {
  id: string;
  name: string;
  element: string;
  hp: number;
  speed: number;
  hook: CharacterHook;
  effectKey: string;
  description: string;
  version: number;
}

export interface CardDefinition {
  id: string;
  type: CardType;
  name: string;
  effectSpec: Record<string, unknown>;
  version: number;
}

export interface PlayerState {
  id: PlayerId;
  seat: number;
  characterId: string;
  hp: number;
  maxHp: number;
  speed: number;
  status: PlayerStatus;
  skillState: Record<string, unknown>;
}

export interface GameState {
  matchId: string;
  phase: GamePhase;
  round: number;
  version: number;
  players: PlayerState[];
  // Full cards, deck order, submissions and private runtime are server-only.
  // They will be modelled in Phase 3.
}

export interface SubmitActionCommand {
  matchId: string;
  roundNumber: number;
  expectedVersion: number;
  cardInstanceId: CardInstanceId;
  targetPlayerId?: PlayerId;
  choice?: string;
  idempotencyKey: string;
}

export interface GameEvent {
  type: string;
  round: number;
  publicPayload: Record<string, unknown>;
}

export interface Transition {
  state: GameState;
  events: GameEvent[];
}

/**
 * All randomness MUST be injected through this interface so the engine is
 * deterministic and replayable (blueprint section 5.1). `Math.random` is
 * forbidden inside the engine by ESLint.
 */
export interface RandomSource {
  nextInt(maxExclusive: number): number;
}
