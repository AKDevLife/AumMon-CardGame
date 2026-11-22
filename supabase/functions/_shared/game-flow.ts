/** Discard Edition match flow (no I/O): paced server bots + turn / reaction timers. `now` is injected. */
import { createSeededRandom, discard, type RngState } from "@aummon/game-engine";

export type Kind = "human" | "bot";
export type Mode = "solo" | "online";

export interface GameRuntime {
  state: discard.GameState;
  rng: RngState;
  deadline: number | null;
}

/** Pause between server-bot actions so players can follow each move. */
export const BOT_STEP_MS = 700;

export const actingSeat = (s: discard.GameState): number | null => discard.actingSeat(s);

/** Runs bots and timeouts until a human must act (timeout: draw & pass, or decline Umbrella). */
export function advanceGame(
  input: GameRuntime,
  kinds: readonly Kind[],
  now: number,
): GameRuntime & { events: discard.GameEvent[] } {
  const rng = createSeededRandom(input.rng);
  let { state, deadline } = input;
  const events: discard.GameEvent[] = [];
  const key = (s: discard.GameState) =>
    `${s.status}:${String(s.turnNumber)}:${String(s.reactions.length)}`;
  let lastKey = key(state);

  for (let guard = 0; guard < 300 && state.status === "active"; guard++) {
    const seat = actingSeat(state);
    if (seat === null) break;
    const playerId = state.players[seat]?.playerId ?? "";
    let command: discard.Command | null = null;
    if (kinds[seat] === "bot") {
      if (deadline !== null && now < deadline) break;
      command = discard.chooseBotCommand(state, seat, rng);
    } else if (deadline !== null && now >= deadline) {
      command =
        state.reactions.length > 0
          ? { type: "react", playerId, useUmbrella: false }
          : { type: "draw", playerId };
    }
    if (!command) break;
    const t = discard.applyCommand(state, command, rng);
    state = t.state;
    events.push(...t.events);
    if (key(state) !== lastKey) {
      lastKey = key(state);
      deadline = null;
    }
    const next = actingSeat(state);
    if (next !== null && kinds[next] === "bot") {
      deadline = now + BOT_STEP_MS;
      break;
    }
  }
  if (deadline === null && state.status === "active") {
    const seat = actingSeat(state);
    if (seat !== null && kinds[seat] === "human")
      deadline =
        now +
        (state.reactions.length > 0
          ? discard.DISCARD_RULES.reactionTimeoutMs
          : discard.DISCARD_RULES.turnTimeoutMs);
  }
  return { state, rng: rng.getState(), deadline, events };
}
