import type { RandomSource } from "../rng/seeded-random.ts";

/**
 * Game Module Interface (docs/architecture/MASTER_ARCHITECTURE.md §4).
 * Each game owns its rules and authoritative state; the platform only orchestrates
 * (seats, timers, bots, persistence). Implementations must stay pure and deterministic.
 */
export type GameId = "edo_battle" | "dummy" | "poker";
export type Seat = number;

export interface Transition<S, E> {
  readonly state: S;
  readonly events: readonly E[];
}

/** A rule violation by the acting seat (mapped to HTTP 409 with `code`). */
export class GameRuleError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "GameRuleError";
  }
}

/** Malformed client intent (mapped to HTTP 400). */
export class InvalidCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCommandError";
  }
}

export interface MatchResult {
  /** Seats that won (empty = no winner, e.g. abandoned). */
  readonly winners: readonly Seat[];
  /** Final score / chip count per seat, when the game has one. */
  readonly scores?: readonly number[];
}

export interface GameModule<S, C, V, E extends { readonly type: string }> {
  readonly id: GameId;
  readonly rulesetVersion: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  /** Consecutive timeouts after which an online human seat is played by the server. */
  readonly afkTimeouts: number;

  start(playerIds: readonly string[], rng: RandomSource): { state: S; events: E[] };
  /** Seat that must act now; null = finished. */
  actingSeat(state: S): Seat | null;
  /** Changes whenever a fresh decision timer must start (new turn / new decision). */
  timerKey(state: S): string;
  /** Time the acting seat gets for its current decision. */
  timeoutMs(state: S): number;
  /** Minimum time left for a decision that must not be rushed (e.g. EDO drawn card). */
  minDecision?(state: S): { readonly seat: Seat; readonly ms: number } | null;
  /** Commands accepted even when the client's expectedVersion is stale (e.g. EDO reactions). */
  allowsStaleVersion?(command: C): boolean;
  /** Validates raw client intent (throws InvalidCommandError). */
  parseCommand(raw: unknown): C;
  /** Applies `command` for `seat` (throws GameRuleError). */
  apply(state: S, seat: Seat, command: C, rng: RandomSource): Transition<S, E>;
  /** Commands the server applies when `seat` runs out of time. */
  timeoutCommands(state: S, seat: Seat): C[];
  /** Follow-up after a timed-out command while the same seat still decides (or null). */
  afterTimeout?(state: S, seat: Seat): C | null;
  /** Bot decision for `seat`. */
  bot(state: S, seat: Seat, rng: RandomSource): C;
  /** What `seat` may see (null = spectator). The only source of client game data. */
  view(state: S, seat: Seat | null): V;
  /** Redacted copy of `event` safe for every match member, or null to keep it private. */
  publicEvent(event: E): unknown;
  /** Private event payloads only `seat` may receive (e.g. peeks). */
  privateEvents(events: readonly E[], seat: Seat | null): unknown[];
  /** Timeout marker event (server-only). */
  timeoutEvent(seat: Seat): E;
  isFinished(state: S): boolean;
  result(state: S): MatchResult | null;
  /** Cards in each seat's hand (public count). */
  handCounts(state: S): number[];
  /** Turn / hand counter shown and stored as matches.round_number. */
  round(state: S): number;
  /** matches.phase value for the current state. */
  phase(state: S): string;
}

/** Registry view of a module (method parameters are bivariant, so every game fits). */
export type AnyGameModule = GameModule<unknown, unknown, unknown, { readonly type: string }>;
