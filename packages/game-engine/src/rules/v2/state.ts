/** Ruleset 2 match state (spec §3.3, §4). Plain data only — safe to serialize. */
import type { Keyword } from "./types.ts";

export type Seat = 0 | 1;

export interface CardInstance {
  readonly instanceId: string;
  readonly cardId: string;
}

export interface UnitInstance extends CardInstance {
  damage: number;
  exhausted: boolean;
  equipment: CardInstance[];
  /** Previous card ids (Evolution history, spec §3.1). */
  history: string[];
  /** Keywords granted by Fusion inheritance (spec §4.11). */
  bonusKeywords: Keyword[];
  /** "Until end of turn" ATK bonus (Boost) and its once-per-turn flag. */
  tempAtk: number;
  boostUsed: boolean;
}

export interface PlayerState {
  readonly playerId: string;
  hp: number;
  spark: number;
  maxSpark: number;
  deck: CardInstance[];
  hand: CardInstance[];
  units: UnitInstance[];
  discard: CardInstance[];
  /** Next fatigue damage − 1 (spec §4.8). */
  fatigue: number;
  mulliganDone: boolean;
}

export type MatchStatus = "mulligan" | "active" | "finished";
/** Main → Battle is one-way within a turn (owner decision R2-6). */
export type TurnPhase = "main" | "battle";
export type MatchResult = { readonly winner: Seat } | { readonly draw: true };

export interface MatchState {
  readonly rulesetVersion: "2";
  status: MatchStatus;
  readonly firstSeat: Seat;
  activeSeat: Seat;
  phase: TurnPhase;
  turn: number;
  players: [PlayerState, PlayerState];
  result: MatchResult | null;
}

export type GameEvent =
  | { type: "turn_started"; seat: Seat; turn: number; spark: number }
  | { type: "card_drawn"; seat: Seat; instanceId: string }
  | { type: "card_burned"; seat: Seat; instanceId: string; cardId: string }
  | { type: "fatigue"; seat: Seat; damage: number }
  | { type: "mulligan"; seat: Seat; count: number }
  | { type: "unit_summoned"; seat: Seat; instanceId: string; cardId: string; exhausted: boolean }
  | { type: "boosted"; seat: Seat; instanceId: string }
  | {
      type: "attacked";
      seat: Seat;
      attackerId: string;
      target: string;
      damageDealt: number;
      damageTaken: number;
      piercing: number;
    }
  | { type: "unit_destroyed"; seat: Seat; instanceId: string }
  | { type: "action_played"; seat: Seat; instanceId: string; cardId: string }
  /** Search reveals the found card (spec §5.18). */
  | { type: "card_searched"; seat: Seat; instanceId: string; cardId: string }
  | { type: "card_recycled"; seat: Seat; instanceId: string; cardId: string }
  | { type: "equipment_attached"; seat: Seat; instanceId: string; cardId: string; unitId: string }
  | { type: "turn_ended"; seat: Seat }
  | { type: "forfeit"; seat: Seat }
  | { type: "match_ended"; result: MatchResult };

export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

export function cloneState(s: MatchState): MatchState {
  const copyPlayer = (p: PlayerState): PlayerState => ({
    ...p,
    deck: [...p.deck],
    hand: [...p.hand],
    discard: [...p.discard],
    units: p.units.map((u) => ({
      ...u,
      equipment: [...u.equipment],
      history: [...u.history],
      bonusKeywords: [...u.bonusKeywords],
    })),
  });
  return { ...s, players: [copyPlayer(s.players[0]), copyPlayer(s.players[1])] };
}
