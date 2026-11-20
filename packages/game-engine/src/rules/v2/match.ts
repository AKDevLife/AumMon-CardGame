import type { RandomSource } from "../../domain/types.ts";
import { getCardDefinition } from "./cards.ts";
import { RULESET_V2 } from "./constants.ts";
import {
  cloneState,
  other,
  type CardInstance,
  type GameEvent,
  type MatchState,
  type PlayerState,
  type Seat,
} from "./state.ts";

/**
 * Ruleset 2 core flow (spec §4.1–4.6, §4.8; clarifications R2-2…R2-5).
 * Combat (8.4), Actions/Equipment (8.5) and Evolution/Fusion (8.6) build on this.
 */
export type CommandErrorCode =
  | "match_finished"
  | "wrong_phase"
  | "not_your_turn"
  | "unknown_player"
  | "card_not_in_hand"
  | "not_a_unit"
  | "not_enough_spark"
  | "unit_zone_full"
  | "mulligan_done"
  | "duplicate_card";

export class CommandError extends Error {
  constructor(readonly code: CommandErrorCode) {
    super(code);
    this.name = "CommandError";
  }
}

export type Command =
  | {
      readonly type: "mulligan";
      readonly playerId: string;
      readonly instanceIds: readonly string[];
    }
  | { readonly type: "summon"; readonly playerId: string; readonly instanceId: string }
  | { readonly type: "end_turn"; readonly playerId: string }
  | { readonly type: "forfeit"; readonly playerId: string };

export interface Transition {
  readonly state: MatchState;
  readonly events: readonly GameEvent[];
}

export interface MatchInput {
  readonly playerIds: readonly [string, string];
  /** Deck as card id → copies (e.g. STARTER_DECK_V2). */
  readonly decks: readonly [Readonly<Record<string, number>>, Readonly<Record<string, number>>];
}

function shuffle<T>(items: readonly T[], rng: RandomSource): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

function buildDeck(seat: Seat, list: Readonly<Record<string, number>>): CardInstance[] {
  const cards: CardInstance[] = [];
  for (const [cardId, copies] of Object.entries(list)) {
    getCardDefinition(cardId);
    for (let i = 0; i < copies; i++) cards.push({ instanceId: `p${seat}-${cards.length}`, cardId });
  }
  if (cards.length !== RULESET_V2.deckSize)
    throw new Error(`deck must have ${RULESET_V2.deckSize} cards`);
  return cards;
}

/** Shuffle, pick first player at random (R2-5), deal 5; match waits for both mulligans. */
export function initializeMatch(input: MatchInput, rng: RandomSource): MatchState {
  const players = ([0, 1] as const).map((seat): PlayerState => {
    const deck = shuffle(buildDeck(seat, input.decks[seat]), rng);
    return {
      playerId: input.playerIds[seat],
      hp: RULESET_V2.playerHp,
      spark: 0,
      maxSpark: 0,
      hand: deck.splice(0, RULESET_V2.initialHand),
      deck,
      units: [],
      discard: [],
      fatigue: 0,
      mulliganDone: false,
    };
  }) as [PlayerState, PlayerState];
  const firstSeat: Seat = rng.nextInt(2) === 0 ? 0 : 1;
  return {
    rulesetVersion: "2",
    status: "mulligan",
    firstSeat,
    activeSeat: firstSeat,
    turn: 0,
    players,
    result: null,
  };
}

function seatOf(state: MatchState, playerId: string): Seat {
  if (state.players[0].playerId === playerId) return 0;
  if (state.players[1].playerId === playerId) return 1;
  throw new CommandError("unknown_player");
}

function checkEnd(state: MatchState, events: GameEvent[]): void {
  const [a, b] = state.players;
  if (a.hp > 0 && b.hp > 0) return;
  state.result = a.hp <= 0 && b.hp <= 0 ? { draw: true } : { winner: a.hp <= 0 ? 1 : 0 };
  state.status = "finished";
  events.push({ type: "match_ended", result: state.result });
}

function draw(state: MatchState, seat: Seat, events: GameEvent[]): void {
  const p = state.players[seat];
  const card = p.deck.shift();
  if (!card) {
    p.fatigue += 1;
    p.hp -= p.fatigue;
    events.push({ type: "fatigue", seat, damage: p.fatigue });
    return;
  }
  if (p.hand.length >= RULESET_V2.maxHand) {
    p.discard.push(card);
    events.push({ type: "card_burned", seat, instanceId: card.instanceId, cardId: card.cardId });
    return;
  }
  p.hand.push(card);
  events.push({ type: "card_drawn", seat, instanceId: card.instanceId });
}

/** Start Phase: ready units, +1 max SPARK (cap 8), refill, draw (first turn of first player skips). */
function startTurn(state: MatchState, seat: Seat, events: GameEvent[]): void {
  state.activeSeat = seat;
  state.turn += 1;
  const p = state.players[seat];
  for (const u of p.units) u.exhausted = false;
  p.maxSpark = Math.min(RULESET_V2.maxSpark, p.maxSpark + 1);
  p.spark = p.maxSpark;
  events.push({ type: "turn_started", seat, turn: state.turn, spark: p.spark });
  if (state.turn > 1) draw(state, seat, events);
  checkEnd(state, events);
}

export function applyCommand(state: MatchState, command: Command, rng: RandomSource): Transition {
  if (state.status === "finished") throw new CommandError("match_finished");
  const seat = seatOf(state, command.playerId);
  const next = cloneState(state);
  const events: GameEvent[] = [];
  const me = next.players[seat];

  switch (command.type) {
    case "forfeit": {
      next.status = "finished";
      next.result = { winner: other(seat) };
      events.push({ type: "forfeit", seat }, { type: "match_ended", result: next.result });
      break;
    }
    case "mulligan": {
      if (next.status !== "mulligan") throw new CommandError("wrong_phase");
      if (me.mulliganDone) throw new CommandError("mulligan_done");
      const ids = new Set(command.instanceIds);
      if (ids.size !== command.instanceIds.length) throw new CommandError("duplicate_card");
      const returned = me.hand.filter((c) => ids.has(c.instanceId));
      if (returned.length !== ids.size) throw new CommandError("card_not_in_hand");
      me.hand = me.hand.filter((c) => !ids.has(c.instanceId));
      me.deck = shuffle([...me.deck, ...returned], rng);
      me.hand.push(...me.deck.splice(0, returned.length));
      me.mulliganDone = true;
      events.push({ type: "mulligan", seat, count: returned.length });
      if (next.players.every((p) => p.mulliganDone)) {
        next.status = "active";
        startTurn(next, next.firstSeat, events);
      }
      break;
    }
    case "summon": {
      if (next.status !== "active") throw new CommandError("wrong_phase");
      if (seat !== next.activeSeat) throw new CommandError("not_your_turn");
      const card = me.hand.find((c) => c.instanceId === command.instanceId);
      if (!card) throw new CommandError("card_not_in_hand");
      const def = getCardDefinition(card.cardId);
      if (def.cardType !== "unit") throw new CommandError("not_a_unit");
      if (me.units.length >= RULESET_V2.maxUnits) throw new CommandError("unit_zone_full");
      if (me.spark < def.cost) throw new CommandError("not_enough_spark");
      me.spark -= def.cost;
      me.hand = me.hand.filter((c) => c !== card);
      const exhausted = !def.keywords.includes("haste");
      me.units.push({ ...card, damage: 0, exhausted, equipment: [], history: [] });
      events.push({
        type: "unit_summoned",
        seat,
        instanceId: card.instanceId,
        cardId: card.cardId,
        exhausted,
      });
      break;
    }
    case "end_turn": {
      if (next.status !== "active") throw new CommandError("wrong_phase");
      if (seat !== next.activeSeat) throw new CommandError("not_your_turn");
      events.push({ type: "turn_ended", seat });
      startTurn(next, other(seat), events);
      break;
    }
  }
  return { state: next, events };
}

export type LegalCommand =
  | { readonly type: "mulligan" }
  | { readonly type: "summon"; readonly instanceId: string }
  | { readonly type: "end_turn" };

/** Commands the seat may send now (the bot picks only from these). */
export function getLegalCommands(state: MatchState, seat: Seat): LegalCommand[] {
  if (state.status === "finished") return [];
  const me = state.players[seat];
  if (state.status === "mulligan") return me.mulliganDone ? [] : [{ type: "mulligan" }];
  if (seat !== state.activeSeat) return [];
  const out: LegalCommand[] = [];
  if (me.units.length < RULESET_V2.maxUnits)
    for (const c of me.hand) {
      const def = getCardDefinition(c.cardId);
      if (def.cardType === "unit" && def.cost <= me.spark)
        out.push({ type: "summon", instanceId: c.instanceId });
    }
  out.push({ type: "end_turn" });
  return out;
}
