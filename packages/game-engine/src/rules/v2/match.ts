import type { RandomSource } from "../../domain/types.ts";
import { getCardDefinition } from "./cards.ts";
import { RULESET_V2 } from "./constants.ts";
import { unitAtk, unitHp, unitKeywords } from "./stats.ts";
import {
  cloneState,
  other,
  type CardInstance,
  type GameEvent,
  type MatchState,
  type PlayerState,
  type Seat,
  type UnitInstance,
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
  | "duplicate_card"
  | "unknown_unit"
  | "unit_exhausted"
  | "no_boost"
  | "boost_used"
  | "flying_target"
  | "guard_blocks";

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
  | { readonly type: "boost"; readonly playerId: string; readonly instanceId: string }
  /** target: opponent unit instance id, or "player" for a direct attack. */
  | {
      readonly type: "attack";
      readonly playerId: string;
      readonly attackerId: string;
      readonly target: string;
    }
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
    phase: "main",
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
  state.phase = "main";
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
      requireMain(next, seat);
      const card = me.hand.find((c) => c.instanceId === command.instanceId);
      if (!card) throw new CommandError("card_not_in_hand");
      const def = getCardDefinition(card.cardId);
      if (def.cardType !== "unit") throw new CommandError("not_a_unit");
      if (me.units.length >= RULESET_V2.maxUnits) throw new CommandError("unit_zone_full");
      if (me.spark < def.cost) throw new CommandError("not_enough_spark");
      me.spark -= def.cost;
      me.hand = me.hand.filter((c) => c !== card);
      const exhausted = !def.keywords.includes("haste");
      me.units.push({
        ...card,
        damage: 0,
        exhausted,
        equipment: [],
        history: [],
        bonusKeywords: [],
        tempAtk: 0,
        boostUsed: false,
      });
      events.push({
        type: "unit_summoned",
        seat,
        instanceId: card.instanceId,
        cardId: card.cardId,
        exhausted,
      });
      break;
    }
    case "boost": {
      requireMain(next, seat);
      const unit = findUnit(me.units, command.instanceId);
      if (unit.exhausted) throw new CommandError("unit_exhausted");
      if (!unitKeywords(unit).has("boost")) throw new CommandError("no_boost");
      if (unit.boostUsed) throw new CommandError("boost_used");
      if (me.spark < 1) throw new CommandError("not_enough_spark");
      me.spark -= 1;
      unit.tempAtk += 2;
      unit.boostUsed = true;
      events.push({ type: "boosted", seat, instanceId: unit.instanceId });
      break;
    }
    case "attack": {
      requireTurn(next, seat);
      next.phase = "battle";
      resolveAttack(next, seat, command.attackerId, command.target, events);
      break;
    }
    case "end_turn": {
      requireTurn(next, seat);
      for (const u of me.units) {
        u.tempAtk = 0;
        u.boostUsed = false;
      }
      events.push({ type: "turn_ended", seat });
      startTurn(next, other(seat), events);
      break;
    }
  }
  return { state: next, events };
}

function requireTurn(state: MatchState, seat: Seat): void {
  if (state.status !== "active") throw new CommandError("wrong_phase");
  if (seat !== state.activeSeat) throw new CommandError("not_your_turn");
}

function requireMain(state: MatchState, seat: Seat): void {
  requireTurn(state, seat);
  if (state.phase !== "main") throw new CommandError("wrong_phase");
}

function findUnit(units: readonly UnitInstance[], instanceId: string): UnitInstance {
  const unit = units.find((u) => u.instanceId === instanceId);
  if (!unit) throw new CommandError("unknown_unit");
  return unit;
}

/** Ready Guards that the attacker must hit first (spec §5.18 GUARD; R2-4). */
function forcingGuards(attacker: UnitInstance, defenders: readonly UnitInstance[]): UnitInstance[] {
  const flies = unitKeywords(attacker).has("flying");
  return defenders.filter((d) => {
    const k = unitKeywords(d);
    return k.has("guard") && !d.exhausted && (flies || !k.has("flying"));
  });
}

function canTarget(
  attacker: UnitInstance,
  defenders: readonly UnitInstance[],
  target: string,
): CommandErrorCode | null {
  const guards = forcingGuards(attacker, defenders);
  if (target === "player") return guards.length > 0 ? "guard_blocks" : null;
  const def = defenders.find((d) => d.instanceId === target);
  if (!def) return "unknown_unit";
  if (unitKeywords(def).has("flying") && !unitKeywords(attacker).has("flying"))
    return "flying_target";
  if (guards.length > 0 && !guards.includes(def)) return "guard_blocks";
  return null;
}

/** Simultaneous damage; Piercing excess = max(0, ATK − defender HP before damage) (spec §4.7, §5.14). */
function resolveAttack(
  state: MatchState,
  seat: Seat,
  attackerId: string,
  target: string,
  events: GameEvent[],
): void {
  const me = state.players[seat];
  const foeSeat = other(seat);
  const foe = state.players[foeSeat];
  const attacker = findUnit(me.units, attackerId);
  if (attacker.exhausted) throw new CommandError("unit_exhausted");
  const error = canTarget(attacker, foe.units, target);
  if (error) throw new CommandError(error);

  const atk = unitAtk(attacker);
  attacker.exhausted = true;
  if (target === "player") {
    foe.hp -= atk;
    events.push({
      type: "attacked",
      seat,
      attackerId,
      target,
      damageDealt: atk,
      damageTaken: 0,
      piercing: 0,
    });
  } else {
    const defender = findUnit(foe.units, target);
    const counter = unitAtk(defender);
    const piercing = unitKeywords(attacker).has("piercing")
      ? Math.max(0, atk - unitHp(defender))
      : 0;
    defender.damage += atk;
    attacker.damage += counter;
    foe.hp -= piercing;
    events.push({
      type: "attacked",
      seat,
      attackerId,
      target,
      damageDealt: atk,
      damageTaken: counter,
      piercing,
    });
    destroyDead(state, foeSeat, events);
    destroyDead(state, seat, events);
  }
  checkEnd(state, events);
}

/** Units at HP <= 0 go to Discard with their equipment (spec §4.7). */
function destroyDead(state: MatchState, seat: Seat, events: GameEvent[]): void {
  const p = state.players[seat];
  for (const u of p.units.filter((x) => unitHp(x) <= 0)) {
    p.discard.push({ instanceId: u.instanceId, cardId: u.cardId }, ...u.equipment);
    events.push({ type: "unit_destroyed", seat, instanceId: u.instanceId });
  }
  p.units = p.units.filter((x) => unitHp(x) > 0);
}

export type LegalCommand =
  | { readonly type: "mulligan" }
  | { readonly type: "summon"; readonly instanceId: string }
  | { readonly type: "boost"; readonly instanceId: string }
  | { readonly type: "attack"; readonly attackerId: string; readonly target: string }
  | { readonly type: "end_turn" };

/** Commands the seat may send now (the bot picks only from these). */
export function getLegalCommands(state: MatchState, seat: Seat): LegalCommand[] {
  if (state.status === "finished") return [];
  const me = state.players[seat];
  if (state.status === "mulligan") return me.mulliganDone ? [] : [{ type: "mulligan" }];
  if (seat !== state.activeSeat) return [];
  const foe = state.players[other(seat)];
  const out: LegalCommand[] = [];
  if (state.phase === "main") {
    if (me.units.length < RULESET_V2.maxUnits)
      for (const c of me.hand) {
        const def = getCardDefinition(c.cardId);
        if (def.cardType === "unit" && def.cost <= me.spark)
          out.push({ type: "summon", instanceId: c.instanceId });
      }
    if (me.spark >= 1)
      for (const u of me.units)
        if (!u.exhausted && !u.boostUsed && unitKeywords(u).has("boost"))
          out.push({ type: "boost", instanceId: u.instanceId });
  }
  for (const u of me.units) {
    if (u.exhausted) continue;
    for (const target of ["player", ...foe.units.map((d) => d.instanceId)])
      if (!canTarget(u, foe.units, target))
        out.push({ type: "attack", attackerId: u.instanceId, target });
  }
  out.push({ type: "end_turn" });
  return out;
}
