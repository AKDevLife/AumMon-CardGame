import type { RandomSource } from "../../domain/types.ts";
import { getCardDefinition } from "./cards.ts";
import { RULESET_V2 } from "./constants.ts";
import { EVOLUTION_RECIPES_V2, FUSION_RECIPES_V2 } from "./recipes.ts";
import { canEquip, unitAtk, unitHp, unitKeywords, usedSlots } from "./stats.ts";
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
  | "guard_blocks"
  | "not_an_action"
  | "not_equipment"
  | "invalid_choice"
  | "no_valid_target"
  | "incompatible"
  | "no_free_slot"
  | "no_recipe";

export class CommandError extends Error {
  readonly code: CommandErrorCode;
  constructor(code: CommandErrorCode) {
    super(code);
    this.code = code;
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
  /** choice: Search → equipment card id in deck; Recycle → instance id in discard. */
  | {
      readonly type: "play_action";
      readonly playerId: string;
      readonly instanceId: string;
      readonly choice?: string;
    }
  | {
      readonly type: "attach";
      readonly playerId: string;
      readonly instanceId: string;
      readonly unitId: string;
    }
  | { readonly type: "evolve"; readonly playerId: string; readonly unitId: string }
  | {
      readonly type: "fuse";
      readonly playerId: string;
      readonly unitIds: readonly [string, string];
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
    case "play_action": {
      requireMain(next, seat);
      const card = takeFromHand(me, command.instanceId, "action");
      playAction(next, seat, card, command.choice, events, rng);
      break;
    }
    case "attach": {
      requireMain(next, seat);
      const card = me.hand.find((c) => c.instanceId === command.instanceId);
      if (!card) throw new CommandError("card_not_in_hand");
      const def = getCardDefinition(card.cardId);
      if (def.cardType !== "equipment") throw new CommandError("not_equipment");
      const unit = findUnit(me.units, command.unitId);
      if (!canEquip(unit, card.cardId)) throw new CommandError("incompatible");
      if (usedSlots(unit) + def.slotCost > RULESET_V2.maxEquipmentSlots)
        throw new CommandError("no_free_slot");
      if (me.spark < def.cost) throw new CommandError("not_enough_spark");
      me.spark -= def.cost;
      me.hand = me.hand.filter((c) => c !== card);
      unit.equipment.push(card);
      events.push({
        type: "equipment_attached",
        seat,
        instanceId: card.instanceId,
        cardId: card.cardId,
        unitId: unit.instanceId,
      });
      break;
    }
    case "evolve": {
      requireMain(next, seat);
      evolve(next, seat, command.unitId, events);
      break;
    }
    case "fuse": {
      requireMain(next, seat);
      fuse(next, seat, command.unitIds, events);
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

/** Removes an Action from hand after checking type and cost; the caller resolves it. */
function takeFromHand(p: PlayerState, instanceId: string, kind: "action"): CardInstance {
  const card = p.hand.find((c) => c.instanceId === instanceId);
  if (!card) throw new CommandError("card_not_in_hand");
  const def = getCardDefinition(card.cardId);
  if (def.cardType !== kind) throw new CommandError("not_an_action");
  if (p.spark < def.cost) throw new CommandError("not_enough_spark");
  return card;
}

/** Valid choices for an Action; [] means it cannot be played (owner decision R2-8). */
function actionChoices(p: PlayerState, cardId: string): (string | undefined)[] {
  const out: (string | undefined)[] = [];
  for (const fx of getCardDefinition(cardId).effects) {
    if (fx.type === "DRAW_CARD") out.push(undefined);
    if (fx.type === "SEARCH_CARD")
      for (const id of new Set(p.deck.map((c) => c.cardId)))
        if (getCardDefinition(id).cardType === fx.cardType) out.push(id);
    if (fx.type === "RECYCLE_CARD")
      for (const c of p.discard)
        if (getCardDefinition(c.cardId).cardType === fx.cardType) out.push(c.instanceId);
  }
  return out;
}

/** Action effects (spec §4.4, §5.18; Search choice by player — R2-7); card goes to Discard after. */
function playAction(
  state: MatchState,
  seat: Seat,
  card: CardInstance,
  choice: string | undefined,
  events: GameEvent[],
  rng: RandomSource,
): void {
  const p = state.players[seat];
  const choices = actionChoices(p, card.cardId);
  if (choices.length === 0) throw new CommandError("no_valid_target");
  if (!choices.includes(choice)) throw new CommandError("invalid_choice");
  const def = getCardDefinition(card.cardId);
  p.spark -= def.cost;
  p.hand = p.hand.filter((c) => c !== card);
  events.push({ type: "action_played", seat, instanceId: card.instanceId, cardId: card.cardId });
  for (const fx of def.effects) {
    if (fx.type === "DRAW_CARD") for (let i = 0; i < fx.count; i++) draw(state, seat, events);
    if (fx.type === "SEARCH_CARD") {
      const found = p.deck.find((c) => c.cardId === choice);
      if (!found) throw new CommandError("invalid_choice");
      p.deck = shuffle(
        p.deck.filter((c) => c !== found),
        rng,
      );
      addToHand(p, found);
      events.push({
        type: "card_searched",
        seat,
        instanceId: found.instanceId,
        cardId: found.cardId,
      });
    }
    if (fx.type === "RECYCLE_CARD") {
      const back = p.discard.find((c) => c.instanceId === choice);
      if (!back) throw new CommandError("invalid_choice");
      p.discard = p.discard.filter((c) => c !== back);
      addToHand(p, back);
      events.push({
        type: "card_recycled",
        seat,
        instanceId: back.instanceId,
        cardId: back.cardId,
      });
    }
  }
  p.discard.push(card);
  checkEnd(state, events);
}

/** Hand limit applies to every card that joins the hand (R2-3). */
function addToHand(p: PlayerState, card: CardInstance): void {
  if (p.hand.length >= RULESET_V2.maxHand) p.discard.push(card);
  else p.hand.push(card);
}

function evolutionFor(u: UnitInstance) {
  return EVOLUTION_RECIPES_V2.find(
    (r) => r.sourceCardId === u.cardId && getCardDefinition(u.cardId).stage === r.requiredStage,
  );
}

/** Recipe cost with MODIFY_COST own_evolution (U004), floored at 1 (spec §4.2). */
function evolutionCost(u: UnitInstance, recipeCost: number): number {
  let cost = recipeCost;
  for (const fx of getCardDefinition(u.cardId).effects)
    if (fx.type === "MODIFY_COST") cost += fx.amount;
  return Math.max(RULESET_V2.minCost, cost);
}

/** Evolution (spec §3.1, §4.9): same instance, full HP of new form, exhaustion kept, incompatible equipment discarded. */
function evolve(state: MatchState, seat: Seat, unitId: string, events: GameEvent[]): void {
  const p = state.players[seat];
  const unit = findUnit(p.units, unitId);
  const recipe = evolutionFor(unit);
  if (!recipe) throw new CommandError("no_recipe");
  const cost = evolutionCost(unit, recipe.cost);
  if (p.spark < cost) throw new CommandError("not_enough_spark");
  p.spark -= cost;
  const fromCardId = unit.cardId;
  const evolved: UnitInstance = {
    ...unit,
    cardId: recipe.targetCardId,
    damage: 0,
    history: [...unit.history, fromCardId],
  };
  evolved.equipment = unit.equipment.filter((e) => canEquip(evolved, e.cardId));
  p.discard.push(...unit.equipment.filter((e) => !evolved.equipment.includes(e)));
  p.units = p.units.map((u) => (u === unit ? evolved : u));
  events.push({
    type: "unit_evolved",
    seat,
    instanceId: unit.instanceId,
    fromCardId,
    toCardId: recipe.targetCardId,
    recipeId: recipe.recipeId,
  });
}

function fusionFor(a: UnitInstance, b: UnitInstance) {
  return FUSION_RECIPES_V2.find(
    (r) =>
      (r.parentCardIds[0] === a.cardId && r.parentCardIds[1] === b.cardId) ||
      (r.parentCardIds[0] === b.cardId && r.parentCardIds[1] === a.cardId),
  );
}

/** Fusion (spec §4.11): parents + equipment to Discard, new instance with full HP, Exhausted unless Haste. */
function fuse(
  state: MatchState,
  seat: Seat,
  unitIds: readonly [string, string],
  events: GameEvent[],
): void {
  const p = state.players[seat];
  if (unitIds[0] === unitIds[1]) throw new CommandError("duplicate_card");
  const a = findUnit(p.units, unitIds[0]);
  const b = findUnit(p.units, unitIds[1]);
  const recipe = fusionFor(a, b);
  if (!recipe) throw new CommandError("no_recipe");
  if (p.spark < recipe.cost) throw new CommandError("not_enough_spark");
  p.spark -= recipe.cost;
  const inherited = recipe.inheritedKeywords
    .filter((k) => unitKeywords(a).has(k) || unitKeywords(b).has(k))
    .slice(0, RULESET_V2.maxFusionInheritedKeywords);
  const result = getCardDefinition(recipe.resultCardId);
  const fused: UnitInstance = {
    instanceId: `fusion:${a.instanceId}+${b.instanceId}`,
    cardId: recipe.resultCardId,
    damage: 0,
    exhausted: !(result.keywords.includes("haste") || inherited.includes("haste")),
    equipment: [],
    history: [a.instanceId, b.instanceId],
    bonusKeywords: inherited,
    tempAtk: 0,
    boostUsed: false,
  };
  for (const parent of [a, b])
    p.discard.push({ instanceId: parent.instanceId, cardId: parent.cardId }, ...parent.equipment);
  p.units = [...p.units.filter((u) => u !== a && u !== b), fused];
  events.push({
    type: "unit_fused",
    seat,
    instanceId: fused.instanceId,
    cardId: fused.cardId,
    parentIds: [a.instanceId, b.instanceId],
    recipeId: recipe.recipeId,
  });
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
  | { readonly type: "play_action"; readonly instanceId: string; readonly choice?: string }
  | { readonly type: "attach"; readonly instanceId: string; readonly unitId: string }
  | { readonly type: "evolve"; readonly unitId: string }
  | { readonly type: "fuse"; readonly unitIds: readonly [string, string] }
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
    for (const c of me.hand) {
      const def = getCardDefinition(c.cardId);
      if (def.cost > me.spark) continue;
      if (def.cardType === "action")
        for (const choice of actionChoices(me, c.cardId))
          out.push(
            choice === undefined
              ? { type: "play_action", instanceId: c.instanceId }
              : { type: "play_action", instanceId: c.instanceId, choice },
          );
      if (def.cardType === "equipment")
        for (const u of me.units)
          if (canEquip(u, c.cardId) && usedSlots(u) + def.slotCost <= RULESET_V2.maxEquipmentSlots)
            out.push({ type: "attach", instanceId: c.instanceId, unitId: u.instanceId });
    }
    for (const u of me.units) {
      const recipe = evolutionFor(u);
      if (recipe && evolutionCost(u, recipe.cost) <= me.spark)
        out.push({ type: "evolve", unitId: u.instanceId });
    }
    me.units.forEach((a, i) => {
      for (const b of me.units.slice(i + 1)) {
        const recipe = fusionFor(a, b);
        if (recipe && recipe.cost <= me.spark)
          out.push({ type: "fuse", unitIds: [a.instanceId, b.instanceId] });
      }
    });
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
