import {
  alivePlayersInTurnOrder,
  cloneState,
  getPlayer,
  handOf,
  isAlive,
  must,
} from "../../domain/state.ts";
import type {
  GameEvent,
  GameState,
  PlayerId,
  RandomSource,
  SubmitActionCommand,
  Transition,
} from "../../domain/types.ts";
import { validateAction, type ValidationResult } from "./actions.ts";
import { drawCard } from "./deck.ts";

export class PhaseError extends Error {
  override name = "PhaseError";
}

const AQUA = "SWAP_CARD_ONCE";

/** Aqua may act this round (Rule 11; clarification Q7). */
export function aquaEligible(state: GameState): PlayerId | null {
  const aqua = state.players.find(
    (p) => isAlive(p) && p.effectKey === AQUA && p.skillState["swapUsed"] !== true,
  );
  if (!aqua || handOf(state, aqua.id).length === 0) return null;
  const hasTarget = state.players.some(
    (p) => p.id !== aqua.id && isAlive(p) && handOf(state, p.id).length > 0,
  );
  return hasTarget ? aqua.id : null;
}

/** Round step 1 — Draw & Start (spec §2 round flow, Rules 7–8, 11). */
export function startRound(input: GameState, rng: RandomSource): Transition {
  if (input.result.status !== "ongoing") throw new PhaseError("Match is finished");
  if (input.phase !== "setup" && input.phase !== "draw") {
    throw new PhaseError(`Cannot start a round from phase ${input.phase}`);
  }
  const state = cloneState(input);
  state.round += 1;
  state.version += 1;
  state.submissions = {};
  const events: GameEvent[] = [{ type: "round.started", round: state.round, publicPayload: {} }];

  for (const player of state.players.filter(isAlive).sort((a, b) => a.seat - b.seat)) {
    player.skillState["pyroBonusUsed"] = false;
    const outcome = drawCard(state, player.id, rng);
    events.push({
      type: "card.draw",
      round: state.round,
      publicPayload: { playerId: player.id, outcome },
    });
  }

  state.phase = aquaEligible(state) ? "turn_start" : "select";
  events.push({ type: "phase.changed", round: state.round, publicPayload: { phase: state.phase } });
  return { state, events };
}

export type SkillCommand = { kind: "swap"; targetPlayerId: PlayerId } | { kind: "skip" };

/** Aqua's optional swap during `turn_start` (Rule 11). Skip = keep the skill for later. */
export function useTurnStartSkill(
  input: GameState,
  playerId: PlayerId,
  command: SkillCommand,
  rng: RandomSource,
): Transition {
  if (input.phase !== "turn_start") throw new PhaseError("No skill window open");
  if (aquaEligible(input) !== playerId) throw new PhaseError("Player cannot use a skill now");
  const state = cloneState(input);
  const events: GameEvent[] = [];

  if (command.kind === "swap") {
    const target = getPlayer(state, command.targetPlayerId);
    const targetHand = handOf(state, target.id);
    if (target.id === playerId || !isAlive(target) || targetHand.length === 0) {
      throw new PhaseError("Invalid swap target");
    }
    const myHand = handOf(state, playerId);
    const mine = rng.nextInt(myHand.length);
    const theirs = rng.nextInt(targetHand.length);
    const a = must(myHand[mine], "own card");
    const b = must(targetHand[theirs], "target card");
    myHand[mine] = b;
    targetHand[theirs] = a;
    getPlayer(state, playerId).skillState["swapUsed"] = true;
    events.push({
      type: "skill.swap",
      round: state.round,
      publicPayload: { playerId, targetPlayerId: target.id },
    });
  } else {
    events.push({ type: "skill.skipped", round: state.round, publicPayload: { playerId } });
  }

  state.phase = "select";
  state.version += 1;
  events.push({ type: "phase.changed", round: state.round, publicPayload: { phase: "select" } });
  return { state, events };
}

/**
 * Record a face-down action (Select). Does not bump `version`, so simultaneous
 * submissions from different players do not conflict.
 */
export function submitAction(
  input: GameState,
  playerId: PlayerId,
  command: SubmitActionCommand,
): { result: ValidationResult; transition?: Transition } {
  const result = validateAction(input, playerId, command);
  if (!result.ok) return { result };
  const state = cloneState(input);
  state.submissions[playerId] = result.action;
  return {
    result,
    transition: {
      state,
      events: [{ type: "action.submitted", round: state.round, publicPayload: { playerId } }],
    },
  };
}

/** Players who still need to submit this round. */
export function pendingPlayers(state: GameState): PlayerId[] {
  if (state.phase !== "select") return [];
  return alivePlayersInTurnOrder(state)
    .filter((p) => !state.submissions[p.id])
    .map((p) => p.id);
}
