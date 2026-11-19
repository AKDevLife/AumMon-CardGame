/**
 * Match flow orchestration (server adapter, no I/O): drives the pure engine
 * through rounds, lets server bots act, and applies the timeout policy
 * (Rule 14; clarifications Q7, Q11). `now` is passed in — engine stays pure.
 */
import {
  aquaEligible,
  autoSubmit,
  botContext,
  createSeededRandom,
  normalBot,
  pendingPlayers,
  resolveRound,
  RULESET_V1,
  startRound,
  useTurnStartSkill,
  type GameEvent,
  type GameState,
  type RngState,
} from "@aummon/game-engine";

export interface Runtime {
  state: GameState;
  rng: RngState;
  /** Epoch ms when the current wait expires; null = no timeout. */
  deadline: number | null;
}

export interface AdvanceResult extends Runtime {
  events: GameEvent[];
}

const isBot = (state: GameState, id: string) =>
  state.players.find((p) => p.id === id)?.kind === "bot";

function deadlineFor(state: GameState, now: number): number | null {
  if (state.mode === "pass_play") return null; // clarification Q11
  if (state.phase === "select") return now + RULESET_V1.selectTimeoutMs;
  if (state.phase === "turn_start") return now + RULESET_V1.aquaWindowMs;
  return null;
}

export function advance(input: Runtime, now: number): AdvanceResult {
  const rng = createSeededRandom(input.rng);
  let state = input.state;
  let deadline = input.deadline;
  const events: GameEvent[] = [];
  const expired = () => deadline !== null && now >= deadline;

  for (let guard = 0; guard < 100; guard++) {
    if (state.phase === "end" || state.result.status !== "ongoing") break;

    if (state.phase === "setup" || state.phase === "draw") {
      const t = startRound(state, rng);
      state = t.state;
      events.push(...t.events);
      deadline = deadlineFor(state, now);
      continue;
    }

    if (state.phase === "turn_start") {
      const aqua = aquaEligible(state);
      if (aqua === null) break; // unreachable: engine only opens the window when eligible
      if (isBot(state, aqua) || expired()) {
        const target = isBot(state, aqua)
          ? normalBot.chooseSwapTarget(botContext(state, aqua), rng)
          : null;
        const t = useTurnStartSkill(
          state,
          aqua,
          target ? { kind: "swap", targetPlayerId: target } : { kind: "skip" },
          rng,
        );
        state = t.state;
        events.push(...t.events);
        deadline = deadlineFor(state, now);
        continue;
      }
      break;
    }

    if (state.phase === "select") {
      const bots = pendingPlayers(state).filter((id) => isBot(state, id));
      state = autoSubmit(state, bots, rng);
      const waiting = pendingPlayers(state);
      if (waiting.length > 0) {
        if (!expired()) break;
        state = autoSubmit(state, waiting, rng); // Rule 14: server bot takes over this round
        events.push({
          type: "timeout.auto",
          round: state.round,
          publicPayload: { playerIds: waiting },
        });
      }
      const t = resolveRound(state, rng);
      state = t.state;
      events.push(...t.events);
      deadline = null;
      continue;
    }

    break;
  }
  return { state, rng: rng.getState(), deadline, events };
}
