/**
 * Domain model — blueprint §5.2 contracts, extended with the server-only state
 * needed by Rulebook v1 (task 3.1). The full `GameState` never leaves the
 * server; clients receive `PlayerGameView` (views/player-view.ts).
 */

export type PlayerId = string;
export type CardInstanceId = string;

export type CardType = "attack" | "defense" | "support" | "chaos";

/** Concrete effect of a card definition (spec §2, Rule 5; clarification Q1). */
export type CardEffect = "attack" | "defense" | "support" | "redirect" | "aoe" | "disrupt";

export type CharacterHook =
  "onTurnStart" | "onAttack" | "onBeforeDamaged" | "onAfterDamaged" | "onRoundEnd";

/**
 * `turn_start` is the optional Aqua window between draw and select
 * (Rule 11; clarification Q7). The DB enum gains it in task 4.12.
 */
export type GamePhase = "setup" | "draw" | "turn_start" | "select" | "resolving" | "end";

export type PlayerStatus = "alive" | "eliminated" | "surrendered";
export type PlayerKind = "human" | "bot" | "local";
export type SupportChoice = "heal" | "draw";
export type MatchMode = "solo" | "pass_play" | "online";

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
  effect: CardEffect;
  effectSpec: Record<string, unknown>;
  version: number;
}

/** A physical card in a match (snapshot of its definition). */
export interface CardInstance {
  id: CardInstanceId;
  definitionId: string;
  type: CardType;
  effect: CardEffect;
  name: string;
}

export interface PlayerState {
  id: PlayerId;
  seat: number;
  kind: PlayerKind;
  displayName: string;
  characterId: string;
  hook: CharacterHook;
  effectKey: string;
  hp: number;
  maxHp: number;
  speed: number;
  status: PlayerStatus;
  /** Server-only skill bookkeeping (e.g. Aqua used, Pyro bonus used this round). */
  skillState: Record<string, unknown>;
}

/** A face-down action chosen during Select (server-only until reveal). */
export interface SubmittedAction {
  playerId: PlayerId;
  cardInstanceId: CardInstanceId;
  targetPlayerId?: PlayerId;
  choice?: SupportChoice;
  /** true when chosen by the server bot on timeout/disconnect (Rule 14). */
  auto?: boolean;
}

export type MatchResult =
  { status: "ongoing" } | { status: "win"; winnerId: PlayerId } | { status: "draw" };

export interface GameState {
  matchId: string;
  mode: MatchMode;
  rulesetVersion: string;
  engineVersion: string;
  phase: GamePhase;
  round: number;
  version: number;
  players: PlayerState[];
  /** Card instances by id. */
  cards: Record<CardInstanceId, CardInstance>;
  /** Draw pile, index 0 = top. */
  deck: CardInstanceId[];
  discard: CardInstanceId[];
  hands: Record<PlayerId, CardInstanceId[]>;
  submissions: Record<PlayerId, SubmittedAction>;
  result: MatchResult;
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
