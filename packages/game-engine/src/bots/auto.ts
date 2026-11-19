import { getPlayer } from "../domain/state.ts";
import type { GameState, PlayerId, RandomSource, SubmittedAction } from "../domain/types.ts";
import { getLegalActions } from "../rules/v1/actions.ts";
import { submitAction } from "../rules/v1/round.ts";
import { buildPlayerView } from "../views/player-view.ts";
import { normalBot, type BotDecisionContext, type BotStrategy } from "./strategy.ts";

/** Build the restricted context a bot may see for one seat. */
export function botContext(state: GameState, playerId: PlayerId): BotDecisionContext {
  const { myHand, ...publicView } = buildPlayerView(state, playerId);
  return { playerId, publicView, myHand, legalActions: getLegalActions(state, playerId) };
}

/**
 * Server bot picks an action for a bot seat or a timed-out / disconnected human
 * (Rule 14). Result is a normal submission marked `auto`.
 */
export function chooseBotAction(
  state: GameState,
  playerId: PlayerId,
  rng: RandomSource,
  strategy: BotStrategy = normalBot,
): SubmittedAction {
  getPlayer(state, playerId);
  const choice = strategy.chooseAction(botContext(state, playerId), rng);
  const action: SubmittedAction = { playerId, cardInstanceId: choice.cardInstanceId, auto: true };
  if (choice.targetPlayerId !== undefined) action.targetPlayerId = choice.targetPlayerId;
  if (choice.choice !== undefined) action.choice = choice.choice;
  return action;
}

/**
 * Rule 14: when the Select timer expires (or a seat is a bot), the server bot
 * submits for every listed player who has not acted. Returns the new state.
 */
export function autoSubmit(
  state: GameState,
  playerIds: PlayerId[],
  rng: RandomSource,
  strategy: BotStrategy = normalBot,
): GameState {
  let next = state;
  for (const playerId of playerIds) {
    if (next.submissions[playerId]) continue;
    const action = chooseBotAction(next, playerId, rng, strategy);
    const out = submitAction(next, playerId, {
      matchId: next.matchId,
      roundNumber: next.round,
      expectedVersion: next.version,
      cardInstanceId: action.cardInstanceId,
      ...(action.targetPlayerId !== undefined && { targetPlayerId: action.targetPlayerId }),
      ...(action.choice !== undefined && { choice: action.choice }),
      idempotencyKey: `auto:${next.round}:${playerId}`,
    });
    if (!out.transition)
      throw new Error(`Bot produced an illegal action: ${JSON.stringify(out.result)}`);
    next = out.transition.state;
    const submitted = next.submissions[playerId];
    if (submitted) submitted.auto = true;
  }
  return next;
}
