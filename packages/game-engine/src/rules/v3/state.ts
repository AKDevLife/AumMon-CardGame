/** Ruleset 3 match state. Plain data only — safe to serialize. */
import type { Effect, Keyword, Trigger } from "./types.ts";

export type Seat = 0 | 1;

export interface CardInstance {
  readonly instanceId: string;
  readonly cardId: string;
}

/** A temporary or permanent modifier from an ability. */
export interface Modifier {
  readonly atk: number;
  readonly keyword: Keyword | null;
  /** "end_of_turn", "start_of_0"/"start_of_1" (that seat's next turn), or "permanent". */
  readonly until: "end_of_turn" | "start_of_0" | "start_of_1" | "permanent";
}

export interface UnitInstance extends CardInstance {
  damage: number;
  exhausted: boolean;
  /** Active ability used this turn (once per turn per Object). */
  activeUsed: boolean;
  /** Permanent max HP bonus (e.g. Wrench). */
  hpBonus: number;
  mods: Modifier[];
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
  fatigue: number;
  mulliganDone: boolean;
}

export type MatchStatus = "mulligan" | "active" | "finished";
export type TurnPhase = "main" | "battle";
export type MatchResult = { readonly winner: Seat } | { readonly draw: true };

export interface MatchState {
  readonly rulesetVersion: "3";
  status: MatchStatus;
  readonly firstSeat: Seat;
  activeSeat: Seat;
  phase: TurnPhase;
  turn: number;
  players: [PlayerState, PlayerState];
  result: MatchResult | null;
}

/** Where an ability effect landed: a unit instance id, or a player seat. */
export type EffectTarget = { readonly unit: string } | { readonly player: Seat } | null;

export type GameEvent =
  | { type: "turn_started"; seat: Seat; turn: number; spark: number }
  | { type: "card_drawn"; seat: Seat; instanceId: string }
  | { type: "card_burned"; seat: Seat; instanceId: string; cardId: string }
  | { type: "fatigue"; seat: Seat; damage: number }
  | { type: "mulligan"; seat: Seat; count: number }
  | { type: "unit_summoned"; seat: Seat; instanceId: string; cardId: string; exhausted: boolean }
  | {
      type: "attacked";
      seat: Seat;
      attackerId: string;
      target: string;
      damageDealt: number;
      damageTaken: number;
      piercing: number;
    }
  | { type: "unit_destroyed"; seat: Seat; instanceId: string; cardId: string }
  | {
      type: "ability_activated";
      seat: Seat;
      instanceId: string;
      cardId: string;
      target: string | null;
    }
  | { type: "ability_triggered"; seat: Seat; instanceId: string; cardId: string; trigger: Trigger }
  | {
      type: "effect_applied";
      seat: Seat;
      sourceId: string;
      effect: Effect["type"];
      target: EffectTarget;
      amount: number;
    }
  /** Search reveals the found card. */
  | { type: "card_searched"; seat: Seat; instanceId: string; cardId: string }
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
    units: p.units.map((u) => ({ ...u, mods: [...u.mods] })),
  });
  return { ...s, players: [copyPlayer(s.players[0]), copyPlayer(s.players[1])] };
}
