/** Discard Edition match flow (no I/O): paced server bots + turn / reaction timers. `now` is injected. */
import { createSeededRandom, discard, type RngState } from "@aummon/game-engine";

export type Kind = "human" | "bot";
export type Mode = "solo" | "online";

export interface GameRuntime {
  state: discard.GameState;
  rng: RngState;
  deadline: number | null;
  /** Consecutive timeouts per seat (Online: ≥ afkTimeouts → the server plays that seat). */
  timeouts: number[];
}

/** Pause between server-bot actions so players can follow each move. */
export const BOT_STEP_MS = 700;
/** A command received up to this long after the deadline is still accepted (network). */
export const GRACE_MS = 500;

export const actingSeat = (s: discard.GameState): number | null => discard.actingSeat(s);

/** Seats the server plays now: bots, and Online humans who timed out too often (QM4). */
export function effectiveKinds(
  kinds: readonly Kind[],
  timeouts: readonly number[],
  mode: Mode,
): Kind[] {
  return kinds.map((k, i) =>
    k === "human" && mode === "online" && (timeouts[i] ?? 0) >= discard.DISCARD_RULES.afkTimeouts
      ? "bot"
      : k,
  );
}

/** Timeout = draw & pass (Draw Then Play: the drawn card is kept), or decline Umbrella. */
function timeoutCommands(s: discard.GameState, seat: number): discard.Command[] {
  const playerId = s.players[seat]?.playerId ?? "";
  if (s.reactions.length > 0) return [{ type: "react", playerId, useUmbrella: false }];
  if (s.drawn?.seat === seat) return [{ type: "keep", playerId }];
  return [{ type: "draw", playerId }];
}

/** Runs bots and timeouts until a human must act. */
export function advanceGame(
  input: GameRuntime,
  kinds: readonly Kind[],
  now: number,
  mode: Mode = "solo",
): GameRuntime & { events: discard.GameEvent[] } {
  const rng = createSeededRandom(input.rng);
  let { state, deadline } = input;
  const timeouts = [...input.timeouts];
  const events: discard.GameEvent[] = [];
  const key = (s: discard.GameState) =>
    `${s.status}:${String(s.turnNumber)}:${String(s.reactions.length)}`;
  let lastKey = key(state);
  const kindAt = (seat: number) => effectiveKinds(kinds, timeouts, mode)[seat];

  for (let guard = 0; guard < 300 && state.status === "active"; guard++) {
    const seat = actingSeat(state);
    if (seat === null) break;
    let commands: discard.Command[] = [];
    let timedOut = false;
    if (kindAt(seat) === "bot") {
      if (deadline !== null && now < deadline) break;
      commands = [discard.chooseBotCommand(state, seat, rng)];
    } else if (deadline !== null && now >= deadline) {
      commands = timeoutCommands(state, seat);
      timedOut = true;
      events.push({ type: "timeout", seat });
      timeouts[seat] = (timeouts[seat] ?? 0) + 1;
    }
    if (commands.length === 0) break;
    for (const command of commands) {
      const t = discard.applyCommand(state, command, rng);
      state = t.state;
      events.push(...t.events);
      // A timed-out draw may leave a playable drawn card: keep it too.
      if (timedOut && state.drawn?.seat === seat)
        commands.push({ type: "keep", playerId: state.players[seat]?.playerId ?? "" });
    }
    if (key(state) !== lastKey) {
      lastKey = key(state);
      deadline = null;
    }
    const next = actingSeat(state);
    if (next !== null && kindAt(next) === "bot") {
      deadline = now + BOT_STEP_MS;
      break;
    }
  }
  if (deadline === null && state.status === "active") {
    const seat = actingSeat(state);
    if (seat !== null && kindAt(seat) === "human")
      deadline =
        now +
        (state.reactions.length > 0
          ? discard.DISCARD_RULES.reactionTimeoutMs
          : discard.DISCARD_RULES.turnTimeoutMs);
  }
  // Draw Then Play: deciding on the drawn card always gets a few seconds.
  if (state.drawn && deadline !== null)
    deadline = Math.max(deadline, now + discard.DISCARD_RULES.drawnDecisionMinMs);
  return { state, rng: rng.getState(), deadline, timeouts, events };
}
