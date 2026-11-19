import { getPlayer, isAlive } from "../../domain/state.ts";
import type {
  CardEffect,
  CardInstanceId,
  GameState,
  PlayerId,
  SubmitActionCommand,
  SubmittedAction,
  SupportChoice,
} from "../../domain/types.ts";

/** Effects that require a single opponent target (clarification Q9). */
const NEEDS_TARGET: ReadonlySet<CardEffect> = new Set(["attack", "disrupt", "redirect"]);
const SUPPORT_CHOICES: readonly SupportChoice[] = ["heal", "draw"];

export interface LegalAction {
  cardInstanceId: CardInstanceId;
  effect: CardEffect;
  targetPlayerId?: PlayerId;
  choice?: SupportChoice;
}

export type ValidationErrorCode =
  | "wrong_phase"
  | "wrong_round"
  | "version_conflict"
  | "not_a_player"
  | "player_not_alive"
  | "already_submitted"
  | "card_not_in_hand"
  | "invalid_target"
  | "invalid_choice";

export type ValidationResult =
  { ok: true; action: SubmittedAction } | { ok: false; code: ValidationErrorCode; message: string };

const fail = (code: ValidationErrorCode, message: string): ValidationResult => ({
  ok: false,
  code,
  message,
});

function validTargets(state: GameState, playerId: PlayerId): PlayerId[] {
  return state.players.filter((p) => p.id !== playerId && isAlive(p)).map((p) => p.id);
}

/** Server-side validation of a Select command (blueprint §4.5). Client values are never trusted. */
export function validateAction(
  state: GameState,
  playerId: PlayerId,
  command: SubmitActionCommand,
): ValidationResult {
  if (state.phase !== "select") return fail("wrong_phase", `Match is in phase ${state.phase}`);
  if (command.roundNumber !== state.round) return fail("wrong_round", "Round number mismatch");
  if (command.expectedVersion !== state.version) {
    return fail("version_conflict", "State version changed");
  }
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return fail("not_a_player", "Not a player in this match");
  if (!isAlive(player)) return fail("player_not_alive", "Eliminated players cannot act");
  if (state.submissions[playerId]) return fail("already_submitted", "Action already submitted");

  const hand = state.hands[playerId] ?? [];
  const card = hand.includes(command.cardInstanceId)
    ? state.cards[command.cardInstanceId]
    : undefined;
  if (!card) return fail("card_not_in_hand", "Card is not in your hand");

  const action: SubmittedAction = { playerId, cardInstanceId: card.id };
  if (NEEDS_TARGET.has(card.effect)) {
    if (
      !command.targetPlayerId ||
      !validTargets(state, playerId).includes(command.targetPlayerId)
    ) {
      return fail("invalid_target", "Choose another player who is still alive");
    }
    action.targetPlayerId = command.targetPlayerId;
  } else if (command.targetPlayerId !== undefined) {
    return fail("invalid_target", `${card.effect} does not take a target`);
  }

  if (card.effect === "support") {
    const choice = SUPPORT_CHOICES.find((c) => c === command.choice);
    if (!choice) return fail("invalid_choice", "Support needs choice heal or draw (Rule 6)");
    action.choice = choice;
  } else if (command.choice !== undefined) {
    return fail("invalid_choice", `${card.effect} does not take a choice`);
  }
  return { ok: true, action };
}

/** All legal Select actions for a player (used by bots and UI hints). */
export function getLegalActions(state: GameState, playerId: PlayerId): LegalAction[] {
  if (state.phase !== "select") return [];
  const player = getPlayer(state, playerId);
  if (!isAlive(player) || state.submissions[playerId]) return [];
  const targets = validTargets(state, playerId);
  return (state.hands[playerId] ?? []).flatMap((id): LegalAction[] => {
    const card = state.cards[id];
    if (!card) return [];
    if (NEEDS_TARGET.has(card.effect)) {
      return targets.map((targetPlayerId) => ({
        cardInstanceId: id,
        effect: card.effect,
        targetPlayerId,
      }));
    }
    if (card.effect === "support") {
      return SUPPORT_CHOICES.map((choice) => ({ cardInstanceId: id, effect: card.effect, choice }));
    }
    return [{ cardInstanceId: id, effect: card.effect }];
  });
}
