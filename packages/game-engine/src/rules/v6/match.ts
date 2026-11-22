import type { RandomSource } from "../../rng/seeded-random.ts";
import { getCardDefinition } from "./cards.ts";
import { RULESET_V6 } from "./constants.ts";
import { unitAtk, unitHp, unitKeywords } from "./stats.ts";
import {
  cloneState,
  other,
  type CardInstance,
  type EffectTarget,
  type GameEvent,
  type MatchState,
  type Modifier,
  type PlayerState,
  type Seat,
  type UnitInstance,
} from "./state.ts";
import type { Active, AutoTarget, Duration, Effect, Trigger, TriggeredPassive } from "./types.ts";

/**
 * Ruleset 4 flow: core rules of spec v6.0 §4 (1v1, SPARK, Ready/Exhausted, combat,
 * Guard/Flying/Piercing/Haste) + Object abilities (aummon_game_spec.md §5).
 */
export type CommandErrorCode =
  | "match_finished"
  | "wrong_phase"
  | "not_your_turn"
  | "unknown_player"
  | "card_not_in_hand"
  | "not_enough_spark"
  | "unit_zone_full"
  | "mulligan_done"
  | "duplicate_card"
  | "unknown_unit"
  | "unit_exhausted"
  | "flying_target"
  | "guard_blocks"
  | "first_turn_no_attack"
  | "no_active"
  | "active_used"
  | "invalid_target";

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
  /** target: opponent unit instance id, or "player" for a direct attack. */
  | {
      readonly type: "attack";
      readonly playerId: string;
      readonly attackerId: string;
      readonly target: string;
    }
  /** Use an Object's Active; target = unit instance id or "player" when the ability picks one. */
  | {
      readonly type: "activate";
      readonly playerId: string;
      readonly instanceId: string;
      readonly target?: string;
    }
  | { readonly type: "end_turn"; readonly playerId: string }
  | { readonly type: "forfeit"; readonly playerId: string };

export type LegalCommand =
  | { readonly type: "mulligan" }
  | { readonly type: "summon"; readonly instanceId: string }
  | { readonly type: "attack"; readonly attackerId: string; readonly target: string }
  | { readonly type: "activate"; readonly instanceId: string; readonly target?: string }
  | { readonly type: "end_turn" };

export interface Transition {
  readonly state: MatchState;
  readonly events: readonly GameEvent[];
}

export interface MatchInput {
  readonly playerIds: readonly [string, string];
  readonly decks: readonly [Readonly<Record<string, number>>, Readonly<Record<string, number>>];
}

/** Working context of one command: events, the trigger queue and the safety counter. */
interface Ctx {
  readonly state: MatchState;
  readonly events: GameEvent[];
  readonly rng: RandomSource;
  readonly queue: Pending[];
  resolved: number;
}

interface Pending {
  readonly seat: Seat;
  readonly sourceId: string;
  readonly cardId: string;
  readonly ability: TriggeredPassive;
}

type Target = { readonly unit: UnitInstance; readonly seat: Seat } | { readonly player: Seat };

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
  if (cards.length !== RULESET_V6.deckSize)
    throw new Error(`deck must have ${RULESET_V6.deckSize} cards`);
  return cards;
}

/** Shuffle, pick the first player at random, deal 5; the match waits for both mulligans. */
export function initializeMatch(input: MatchInput, rng: RandomSource): MatchState {
  const players = ([0, 1] as const).map((seat): PlayerState => {
    const deck = shuffle(buildDeck(seat, input.decks[seat]), rng);
    return {
      playerId: input.playerIds[seat],
      hp: RULESET_V6.playerHp,
      spark: 0,
      maxSpark: 0,
      hand: deck.splice(0, RULESET_V6.initialHand),
      deck,
      units: [],
      discard: [],
      fatigue: 0,
      mulliganDone: false,
    };
  }) as [PlayerState, PlayerState];
  const firstSeat: Seat = rng.nextInt(2) === 0 ? 0 : 1;
  // Second-player compensation (owner 2026-11-22): one extra card in the opening hand.
  const second = players[firstSeat === 0 ? 1 : 0];
  const extra = second.deck.shift();
  if (extra) second.hand.push(extra);
  return {
    rulesetVersion: "6",
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

function checkEnd(ctx: Ctx): void {
  const { state } = ctx;
  if (state.status === "finished") return;
  const [a, b] = state.players;
  if (a.hp > 0 && b.hp > 0) return;
  state.result = a.hp <= 0 && b.hp <= 0 ? { draw: true } : { winner: a.hp <= 0 ? 1 : 0 };
  state.status = "finished";
  ctx.events.push({ type: "match_ended", result: state.result });
}

const someoneDead = (s: MatchState) => s.players.some((p) => p.hp <= 0);

function addToHand(ctx: Ctx, seat: Seat, card: CardInstance): boolean {
  const p = ctx.state.players[seat];
  if (p.hand.length >= RULESET_V6.maxHand) {
    p.discard.push(card);
    ctx.events.push({
      type: "card_burned",
      seat,
      instanceId: card.instanceId,
      cardId: card.cardId,
    });
    return false;
  }
  p.hand.push(card);
  return true;
}

function draw(ctx: Ctx, seat: Seat): void {
  const p = ctx.state.players[seat];
  const card = p.deck.shift();
  if (!card) {
    p.fatigue += 1;
    p.hp -= p.fatigue;
    ctx.events.push({ type: "fatigue", seat, damage: p.fatigue });
    return;
  }
  if (addToHand(ctx, seat, card))
    ctx.events.push({ type: "card_drawn", seat, instanceId: card.instanceId });
}

// ---------------------------------------------------------------- triggers & effects

function enqueue(ctx: Ctx, seat: Seat, unit: CardInstance, trigger: Trigger): void {
  const p = getCardDefinition(unit.cardId).passive;
  if (p?.kind === "triggered" && p.on === trigger)
    ctx.queue.push({ seat, sourceId: unit.instanceId, cardId: unit.cardId, ability: p });
}

/** Destroys Objects at HP ≤ 0 (active player's side first) until stable; queues on_destroyed. */
function settleDeaths(ctx: Ctx): void {
  const { state } = ctx;
  for (let changed = true; changed;) {
    changed = false;
    for (const seat of [state.activeSeat, other(state.activeSeat)]) {
      const p = state.players[seat];
      const dead = p.units.filter((u) => unitHp(p.units, u) <= 0);
      if (dead.length === 0) continue;
      changed = true;
      p.units = p.units.filter((u) => !dead.includes(u));
      for (const u of dead) {
        p.discard.push({ instanceId: u.instanceId, cardId: u.cardId });
        ctx.events.push({
          type: "unit_destroyed",
          seat,
          instanceId: u.instanceId,
          cardId: u.cardId,
        });
        enqueue(ctx, seat, u, "on_destroyed");
      }
    }
  }
}

/** Resolves queued triggers in order (new ones go to the back), then checks the winner. */
function resolveQueue(ctx: Ctx): void {
  settleDeaths(ctx);
  while (ctx.queue.length > 0 && !someoneDead(ctx.state)) {
    const next = ctx.queue.shift();
    if (!next) break;
    ctx.events.push({
      type: "ability_triggered",
      seat: next.seat,
      instanceId: next.sourceId,
      cardId: next.cardId,
      trigger: next.ability.on,
    });
    const targets = autoTargets(ctx.state, next.seat, next.sourceId, next.ability.target);
    applyEffect(ctx, next.seat, next.sourceId, next.ability.effect, targets);
    settleDeaths(ctx);
  }
  checkEnd(ctx);
}

function autoTargets(state: MatchState, seat: Seat, sourceId: string, t: AutoTarget): Target[] {
  const mine = state.players[seat].units.map((unit) => ({ unit, seat }));
  const foe = other(seat);
  const theirs = state.players[foe].units.map((unit) => ({ unit, seat: foe }));
  switch (t) {
    case "self":
      return mine.filter((x) => x.unit.instanceId === sourceId);
    case "all_allies":
      return mine;
    case "other_allies":
      return mine.filter((x) => x.unit.instanceId !== sourceId);
    case "all_enemies":
      return theirs;
    case "enemy_player":
      return [{ player: foe }];
    case "own_player":
      return [{ player: seat }];
    case "none":
      return [];
  }
}

function untilFor(duration: Duration, seat: Seat): Modifier["until"] {
  if (duration === "turn") return "end_of_turn";
  if (duration === "permanent") return "permanent";
  return seat === 0 ? "start_of_0" : "start_of_1";
}

function applyEffect(
  ctx: Ctx,
  seat: Seat,
  sourceId: string,
  effect: Effect,
  targets: readonly Target[],
): void {
  ctx.resolved += 1;
  if (ctx.resolved > RULESET_V6.maxEffectsPerCommand)
    throw new Error("effect limit exceeded (loop protection)");
  const { state, events } = ctx;
  const log = (target: EffectTarget, amount: number) => {
    events.push({ type: "effect_applied", seat, sourceId, effect: effect.type, target, amount });
  };
  if (effect.type === "draw") {
    for (let i = 0; i < effect.count; i++) draw(ctx, seat);
    log(null, effect.count);
    return;
  }
  if (effect.type === "search") {
    const p = state.players[seat];
    const found = p.deck.find((c) =>
      (getCardDefinition(c.cardId).traits as readonly string[]).includes(effect.trait),
    );
    if (!found) return;
    p.deck = shuffle(
      p.deck.filter((c) => c !== found),
      ctx.rng,
    );
    if (addToHand(ctx, seat, found))
      events.push({
        type: "card_searched",
        seat,
        instanceId: found.instanceId,
        cardId: found.cardId,
      });
    return;
  }
  for (const t of targets) {
    if ("player" in t) {
      const p = state.players[t.player];
      if (effect.type === "damage") p.hp -= effect.amount;
      else if (effect.type === "heal") p.hp = Math.min(RULESET_V6.playerHp, p.hp + effect.amount);
      else continue;
      log({ player: t.player }, effect.amount);
      continue;
    }
    const u = t.unit;
    let amount = 0;
    switch (effect.type) {
      case "atk":
        u.mods.push({ atk: effect.amount, keyword: null, until: untilFor(effect.duration, seat) });
        amount = effect.amount;
        break;
      case "keyword":
        u.mods.push({ atk: 0, keyword: effect.keyword, until: untilFor(effect.duration, seat) });
        break;
      case "max_hp":
        u.hpBonus += effect.amount;
        amount = effect.amount;
        break;
      case "damage":
        u.damage += effect.amount;
        amount = effect.amount;
        break;
      case "heal":
        amount = Math.min(u.damage, effect.amount);
        u.damage -= amount;
        break;
      case "exhaust":
        u.exhausted = true;
        break;
      case "ready":
        u.exhausted = false;
        break;
    }
    log({ unit: u.instanceId }, amount);
  }
}

// ---------------------------------------------------------------- Active targets

/** No Object may have Guard and Flying at the same time (owner 2026-11-21). */
function conflictsWith(u: UnitInstance, a: Active): boolean {
  if (a.effect.type !== "keyword") return false;
  const k = unitKeywords(u);
  return (
    (a.effect.keyword === "guard" && k.has("flying")) ||
    (a.effect.keyword === "flying" && k.has("guard"))
  );
}

const needsTarget = (e: Effect) => e.type !== "draw" && e.type !== "search";

/** Instance ids / "player" the Active may pick, or null when its target is automatic. */
function pickOptions(
  state: MatchState,
  seat: Seat,
  source: UnitInstance,
  a: Active,
): string[] | null {
  if (typeof a.target === "string") return null;
  const me = state.players[seat];
  const foe = state.players[other(seat)];
  const t = a.target;
  switch (t.pick) {
    case "enemy_unit":
      return foe.units.filter((u) => !t.readyOnly || !u.exhausted).map((u) => u.instanceId);
    case "enemy_unit_or_player":
      return [...foe.units.map((u) => u.instanceId), "player"];
    case "ally":
      return me.units
        .filter((u) => !t.other || u !== source)
        .filter(
          (u) =>
            !t.trait || (getCardDefinition(u.cardId).traits as readonly string[]).includes(t.trait),
        )
        .filter((u) => !t.exhaustedOnly || u.exhausted)
        .filter((u) => !conflictsWith(u, a))
        .map((u) => u.instanceId);
    case "ally_or_own_player":
      return [...me.units.map((u) => u.instanceId), "player"];
  }
}

function resolvePick(state: MatchState, seat: Seat, a: Active, choice: string): Target {
  const pick = typeof a.target === "string" ? null : a.target.pick;
  if (choice === "player") return { player: pick === "ally_or_own_player" ? seat : other(seat) };
  const side: Seat = pick === "ally" || pick === "ally_or_own_player" ? seat : other(seat);
  const unit = state.players[side].units.find((u) => u.instanceId === choice);
  if (!unit) throw new CommandError("invalid_target");
  return { unit, seat: side };
}

function canActivate(u: UnitInstance): Active | null {
  const a = getCardDefinition(u.cardId).active;
  // Ruleset 5: a sleeping Object may use its Active; once per turn (owner 2026-11-21).
  if (!a || u.activeUsed) return null;
  return a;
}

function activate(ctx: Ctx, seat: Seat, instanceId: string, choice: string | undefined): void {
  const { state } = ctx;
  const me = state.players[seat];
  const unit = findUnit(me.units, instanceId);
  const a = getCardDefinition(unit.cardId).active;
  if (!a) throw new CommandError("no_active");
  if (unit.activeUsed) throw new CommandError("active_used");
  // Targets are validated before anything is paid (spec §5.3 step 4).
  const options = pickOptions(state, seat, unit, a);
  let targets: Target[];
  if (options) {
    if (choice === undefined || !options.includes(choice)) throw new CommandError("invalid_target");
    targets = [resolvePick(state, seat, a, choice)];
  } else {
    targets = autoTargets(state, seat, unit.instanceId, a.target as AutoTarget);
    if (needsTarget(a.effect) && targets.length === 0) throw new CommandError("invalid_target");
  }
  // Actives are free and do not put the source to sleep (ruleset 5), unless the card says so.
  if (a.sleepAtEndOfTurn) unit.sleepAtEnd = true;
  unit.activeUsed = true;
  ctx.events.push({
    type: "ability_activated",
    seat,
    instanceId: unit.instanceId,
    cardId: unit.cardId,
    target: options ? (choice ?? null) : null,
  });
  applyEffect(ctx, seat, unit.instanceId, a.effect, targets);
  resolveQueue(ctx);
}

// ---------------------------------------------------------------- turn flow

function expire(state: MatchState, until: Modifier["until"]): void {
  for (const p of state.players)
    for (const u of p.units) u.mods = u.mods.filter((m) => m.until !== until);
}

/** Start Phase: expire "until your next turn", ready, +1 max SPARK, refill, draw, on_turn_start. */
function startTurn(ctx: Ctx, seat: Seat): void {
  const { state } = ctx;
  state.activeSeat = seat;
  state.phase = "main";
  state.turn += 1;
  expire(state, seat === 0 ? "start_of_0" : "start_of_1");
  const p = state.players[seat];
  for (const u of p.units) u.exhausted = false;
  p.maxSpark = Math.min(RULESET_V6.maxSpark, p.maxSpark + 1);
  p.spark = p.maxSpark;
  // Second-player compensation: +1 SPARK on their first turn only (turn 2 of the game).
  if (state.turn === 2) p.spark += 1;
  ctx.events.push({ type: "turn_started", seat, turn: state.turn, spark: p.spark });
  if (state.turn > 1) draw(ctx, seat);
  for (const u of p.units) enqueue(ctx, seat, u, "on_turn_start");
  resolveQueue(ctx);
}

function endTurn(ctx: Ctx, seat: Seat): void {
  const { state } = ctx;
  const me = state.players[seat];
  for (const u of me.units) enqueue(ctx, seat, u, "on_turn_end");
  resolveQueue(ctx);
  if (state.status === "finished") return;
  expire(state, "end_of_turn");
  for (const u of me.units) {
    u.activeUsed = false;
    if (u.sleepAtEnd) u.exhausted = true;
    u.sleepAtEnd = false;
  }
  settleDeaths(ctx);
  ctx.events.push({ type: "turn_ended", seat });
  startTurn(ctx, other(seat));
}

function summon(ctx: Ctx, seat: Seat, instanceId: string): void {
  const me = ctx.state.players[seat];
  const card = me.hand.find((c) => c.instanceId === instanceId);
  if (!card) throw new CommandError("card_not_in_hand");
  const def = getCardDefinition(card.cardId);
  if (me.units.length >= RULESET_V6.maxUnits) throw new CommandError("unit_zone_full");
  if (me.spark < def.cost) throw new CommandError("not_enough_spark");
  me.spark -= def.cost;
  me.hand = me.hand.filter((c) => c !== card);
  const exhausted = !def.keywords.includes("haste");
  const unit: UnitInstance = {
    ...card,
    damage: 0,
    exhausted,
    activeUsed: false,
    sleepAtEnd: false,
    hpBonus: 0,
    mods: [],
  };
  me.units.push(unit);
  ctx.events.push({
    type: "unit_summoned",
    seat,
    instanceId: card.instanceId,
    cardId: card.cardId,
    exhausted,
  });
  enqueue(ctx, seat, unit, "on_summon");
  resolveQueue(ctx);
}

export function applyCommand(state: MatchState, command: Command, rng: RandomSource): Transition {
  if (state.status === "finished") throw new CommandError("match_finished");
  const seat = seatOf(state, command.playerId);
  const next = cloneState(state);
  const ctx: Ctx = { state: next, events: [], rng, queue: [], resolved: 0 };
  const me = next.players[seat];

  switch (command.type) {
    case "forfeit": {
      next.status = "finished";
      next.result = { winner: other(seat) };
      ctx.events.push({ type: "forfeit", seat }, { type: "match_ended", result: next.result });
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
      ctx.events.push({ type: "mulligan", seat, count: returned.length });
      if (next.players.every((p) => p.mulliganDone)) {
        next.status = "active";
        startTurn(ctx, next.firstSeat);
      }
      break;
    }
    case "summon":
      requireTurn(next, seat);
      summon(ctx, seat, command.instanceId);
      break;
    case "activate":
      requireTurn(next, seat);
      activate(ctx, seat, command.instanceId, command.target);
      break;
    case "attack":
      requireTurn(next, seat);
      resolveAttack(ctx, seat, command.attackerId, command.target);
      break;
    case "end_turn":
      requireTurn(next, seat);
      endTurn(ctx, seat);
      break;
  }
  return { state: next, events: ctx.events };
}

function requireTurn(state: MatchState, seat: Seat): void {
  if (state.status !== "active") throw new CommandError("wrong_phase");
  if (seat !== state.activeSeat) throw new CommandError("not_your_turn");
}

function findUnit(units: readonly UnitInstance[], instanceId: string): UnitInstance {
  const unit = units.find((u) => u.instanceId === instanceId);
  if (!unit) throw new CommandError("unknown_unit");
  return unit;
}

// ---------------------------------------------------------------- combat

/** Guards the attacker must hit first — awake or asleep (ruleset 5, owner 2026-11-21). */
function forcingGuards(defenders: readonly UnitInstance[]): UnitInstance[] {
  return defenders.filter((d) => unitKeywords(d).has("guard"));
}

function canTarget(
  attacker: UnitInstance,
  defenders: readonly UnitInstance[],
  target: string,
): CommandErrorCode | null {
  const guards = forcingGuards(defenders);
  if (target === "player") return guards.length > 0 ? "guard_blocks" : null;
  const def = defenders.find((d) => d.instanceId === target);
  if (!def) return "unknown_unit";
  if (unitKeywords(def).has("flying") && !unitKeywords(attacker).has("flying"))
    return "flying_target";
  if (guards.length > 0 && !guards.includes(def)) return "guard_blocks";
  return null;
}

/** on_attack triggers resolve before damage; then simultaneous damage + Piercing (spec §4.6). */
function resolveAttack(ctx: Ctx, seat: Seat, attackerId: string, target: string): void {
  const { state } = ctx;
  const me = state.players[seat];
  const foeSeat = other(seat);
  const foe = state.players[foeSeat];
  const attacker = findUnit(me.units, attackerId);
  if (attacker.exhausted) throw new CommandError("unit_exhausted");
  // The first player cannot attack on the first turn of the game (owner 2026-11-22).
  if (state.turn === 1) throw new CommandError("first_turn_no_attack");
  const error = canTarget(attacker, foe.units, target);
  if (error) throw new CommandError(error);

  attacker.exhausted = true;
  enqueue(ctx, seat, attacker, "on_attack");
  resolveQueue(ctx);
  if (state.status === "finished" || !me.units.includes(attacker)) return;

  const atk = unitAtk(me.units, attacker);
  if (target === "player") {
    foe.hp -= atk;
    ctx.events.push({
      type: "attacked",
      seat,
      attackerId,
      target,
      damageDealt: atk,
      damageTaken: 0,
      piercing: 0,
    });
  } else {
    const defender = foe.units.find((d) => d.instanceId === target);
    if (!defender) {
      resolveQueue(ctx);
      return;
    }
    const counter = unitAtk(foe.units, defender);
    const piercing = unitKeywords(attacker).has("piercing")
      ? Math.max(0, atk - unitHp(foe.units, defender))
      : 0;
    defender.damage += atk;
    attacker.damage += counter;
    foe.hp -= piercing;
    ctx.events.push({
      type: "attacked",
      seat,
      attackerId,
      target,
      damageDealt: atk,
      damageTaken: counter,
      piercing,
    });
  }
  resolveQueue(ctx);
}

// ---------------------------------------------------------------- legal commands

/** Commands the seat may send now (the bot picks only from these). */
export function getLegalCommands(state: MatchState, seat: Seat): LegalCommand[] {
  if (state.status === "finished") return [];
  const me = state.players[seat];
  if (state.status === "mulligan") return me.mulliganDone ? [] : [{ type: "mulligan" }];
  if (seat !== state.activeSeat) return [];
  const foe = state.players[other(seat)];
  const out: LegalCommand[] = [];
  {
    if (me.units.length < RULESET_V6.maxUnits)
      for (const c of me.hand)
        if (getCardDefinition(c.cardId).cost <= me.spark)
          out.push({ type: "summon", instanceId: c.instanceId });
    for (const u of me.units) {
      const a = canActivate(u);
      if (!a) continue;
      const options = pickOptions(state, seat, u, a);
      if (options)
        for (const target of options)
          out.push({ type: "activate", instanceId: u.instanceId, target });
      else if (
        !needsTarget(a.effect) ||
        autoTargets(state, seat, u.instanceId, a.target as AutoTarget).length > 0
      )
        out.push({ type: "activate", instanceId: u.instanceId });
    }
  }
  for (const u of me.units) {
    if (u.exhausted || state.turn === 1) continue;
    for (const target of ["player", ...foe.units.map((d) => d.instanceId)])
      if (!canTarget(u, foe.units, target))
        out.push({ type: "attack", attackerId: u.instanceId, target });
  }
  out.push({ type: "end_turn" });
  return out;
}
