import {
  alivePlayersInTurnOrder,
  cloneState,
  compareTurnOrder,
  getPlayer,
  handOf,
  isAlive,
  must,
} from "../../domain/state.ts";
import type {
  GameEvent,
  GameState,
  PlayerId,
  PlayerState,
  RandomSource,
  SubmittedAction,
  Transition,
} from "../../domain/types.ts";
import { drawCard } from "./deck.ts";
import { PhaseError } from "./round.ts";

type HitSource = "attack" | "aoe";

interface RoundContext {
  state: GameState;
  rng: RandomSource;
  events: GameEvent[];
  /** Remaining Defense shield per player this round (Rule 4). */
  shields: Map<PlayerId, number>;
  /** Active Redirect: protected player → new target (clarification Q2). */
  redirects: Map<PlayerId, PlayerId>;
}

function emit(ctx: RoundContext, type: string, publicPayload: Record<string, unknown>): void {
  ctx.events.push({ type, round: ctx.state.round, publicPayload });
}

function discardRandomFromHand(ctx: RoundContext, playerId: PlayerId): boolean {
  const hand = handOf(ctx.state, playerId);
  if (hand.length === 0) return false;
  const [card] = hand.splice(ctx.rng.nextInt(hand.length), 1);
  ctx.state.discard.push(must(card, "discarded card"));
  return true;
}

/** Rule 13 + clarification Q8: eliminated immediately, hand goes to discard. */
function eliminate(ctx: RoundContext, player: PlayerState): void {
  player.status = "eliminated";
  player.hp = Math.min(player.hp, 0);
  const hand = handOf(ctx.state, player.id);
  ctx.state.discard.push(...hand.splice(0));
  emit(ctx, "player.eliminated", { playerId: player.id });
}

/**
 * One Hit (Rule 12): onAttack (attacker) → onBeforeDamaged (target: Breeze, Terra)
 * → Defense shield → HP → onAfterDamaged. Pyro bonus applied after reductions
 * only if ≥1 damage lands (Rule 10; clarification Q4).
 */
function hit(
  ctx: RoundContext,
  attacker: PlayerState,
  target: PlayerState,
  base: number,
  source: HitSource,
): void {
  // onAttack
  const pyroArmed =
    source === "attack" &&
    attacker.effectKey === "BONUS_DMG_FIRST_HIT" &&
    attacker.skillState["pyroBonusUsed"] !== true;

  // onBeforeDamaged
  let damage = base;
  if (target.effectKey === "DISCARD_TO_DODGE" && discardRandomFromHand(ctx, target.id)) {
    emit(ctx, "hit.dodged", { attackerId: attacker.id, targetId: target.id, source });
    return;
  }
  let reduced = 0;
  if (target.effectKey === "REDUCE_DMG_1") {
    reduced = Math.min(1, damage);
    damage -= reduced;
  }

  // Defense shield
  const shield = ctx.shields.get(target.id) ?? 0;
  const absorbed = Math.min(shield, damage);
  damage -= absorbed;
  if (absorbed > 0) ctx.shields.set(target.id, shield - absorbed);

  let bonus = 0;
  if (pyroArmed && damage >= 1) {
    bonus = 1;
    damage += 1;
    attacker.skillState["pyroBonusUsed"] = true;
  }

  target.hp -= damage;
  emit(ctx, "hit", {
    attackerId: attacker.id,
    targetId: target.id,
    source,
    damage,
    reduced,
    absorbed,
    bonus,
    hp: target.hp,
  });
  if (target.hp <= 0) eliminate(ctx, target);
  // onAfterDamaged: no Rulebook v1 starter uses it.
}

/** Single-target actions follow an active Redirect once (clarification Q2). */
function resolveTarget(ctx: RoundContext, actorId: PlayerId, targetId: PlayerId): PlayerId {
  const redirected = ctx.redirects.get(targetId);
  if (redirected === undefined) return targetId;
  emit(ctx, "action.redirected", { actorId, from: targetId, to: redirected });
  return redirected;
}

function performAction(ctx: RoundContext, actor: PlayerState, action: SubmittedAction): void {
  const card = ctx.state.cards[action.cardInstanceId];
  if (!card) throw new Error(`Unknown card ${action.cardInstanceId}`);
  const { state } = ctx;

  switch (card.effect) {
    case "attack":
    case "disrupt": {
      const targetId = resolveTarget(ctx, actor.id, must(action.targetPlayerId, "target"));
      const target = getPlayer(state, targetId);
      if (!isAlive(target)) {
        emit(ctx, "action.fizzled", { actorId: actor.id, targetId }); // Rule 3
        return;
      }
      if (card.effect === "attack") {
        hit(ctx, actor, target, 1, "attack");
      } else {
        const discarded = discardRandomFromHand(ctx, target.id);
        emit(ctx, "card.disrupted", { actorId: actor.id, targetId, discarded });
      }
      return;
    }
    case "aoe":
      for (const target of alivePlayersInTurnOrder(state).filter((p) => p.id !== actor.id)) {
        if (isAlive(target)) hit(ctx, actor, target, 1, "aoe");
      }
      return;
    case "support":
      if (action.choice === "heal") {
        const before = actor.hp;
        actor.hp = Math.min(actor.maxHp, actor.hp + 1);
        emit(ctx, "support.heal", { playerId: actor.id, healed: actor.hp - before, hp: actor.hp });
      } else {
        emit(ctx, "support.draw", {
          playerId: actor.id,
          outcome: drawCard(state, actor.id, ctx.rng),
        });
      }
      return;
    case "defense":
    case "redirect":
      return; // round-long effects applied at reveal
  }
}

export function decideResult(state: GameState): void {
  const alive = state.players.filter(isAlive);
  if (alive.length === 1) state.result = { status: "win", winnerId: must(alive[0], "winner").id };
  else if (alive.length === 0) state.result = { status: "draw" }; // Rule 15
}

/** Round steps 3–4 — Reveal, Resolve, End (spec §2; Rules 1–6, 9–13, 15). */
export function resolveRound(input: GameState, rng: RandomSource): Transition {
  if (input.phase !== "select") throw new PhaseError("Can only resolve from select");
  const alive = input.players.filter(isAlive);
  if (alive.some((p) => !input.submissions[p.id]))
    throw new PhaseError("Not all players submitted");

  const state = cloneState(input);
  state.phase = "resolving";
  const ctx: RoundContext = { state, rng, events: [], shields: new Map(), redirects: new Map() };
  const ordered = state.players.filter((p) => state.submissions[p.id]).sort(compareTurnOrder);

  // Reveal: all actions face up; played cards leave the hand (not dodge-able).
  const plays = ordered.map((p) => {
    const action = must(state.submissions[p.id], "submission");
    const hand = handOf(state, p.id);
    hand.splice(hand.indexOf(action.cardInstanceId), 1);
    const card = state.cards[action.cardInstanceId];
    if (card?.effect === "defense") ctx.shields.set(p.id, 1);
    if (card?.effect === "redirect")
      ctx.redirects.set(p.id, must(action.targetPlayerId, "redirect target"));
    return { player: p, action, card };
  });
  emit(ctx, "actions.revealed", {
    actions: plays.map(({ player, action, card }) => ({
      playerId: player.id,
      definitionId: card?.definitionId,
      effect: card?.effect,
      targetPlayerId: action.targetPlayerId,
      choice: action.choice,
      auto: action.auto === true,
    })),
  });

  for (const { player, action } of plays) {
    if (isAlive(player)) performAction(ctx, player, action);
    else emit(ctx, "action.cancelled", { playerId: player.id }); // Rule 13
    state.discard.push(action.cardInstanceId); // clarification Q8
  }

  // onRoundEnd: no Rulebook v1 starter uses it.
  decideResult(state);
  state.submissions = {};
  state.phase = state.result.status === "ongoing" ? "draw" : "end";
  state.version += 1;
  emit(ctx, "round.ended", { result: state.result });
  return { state, events: ctx.events };
}
