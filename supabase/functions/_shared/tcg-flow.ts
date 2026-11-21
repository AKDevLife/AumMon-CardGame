/** Ruleset 4 match flow (no I/O): server bots + 90 s turn timer. `now` is injected. */
import { createSeededRandom, v4, type RngState } from "@aummon/game-engine";

type Seat = v4.Seat;
export type Kind = "human" | "bot" | "local";
export type Mode = "solo" | "pass_play" | "online";

export interface TcgRuntime {
  state: v4.MatchState;
  rng: RngState;
  deadline: number | null;
}

/** Seat that must act now: active seat, or during mulligan the first seat not done. */
export function actingSeat(state: v4.MatchState): Seat | null {
  if (state.status === "finished") return null;
  if (state.status === "mulligan") {
    const i = state.players.findIndex((p) => !p.mulliganDone);
    return i === 0 ? 0 : i === 1 ? 1 : null;
  }
  return state.activeSeat;
}

/** Runs server bots and the turn timer until a human must act (spec §1.3: timeout → end turn). */
/** Pause between server-bot actions so players can follow each move (owner: ≤ 1 s). */
export const BOT_STEP_MS = 700;

export function advanceTcg(
  input: TcgRuntime,
  kinds: readonly [Kind, Kind],
  mode: Mode,
  now: number,
): TcgRuntime & { events: v4.GameEvent[] } {
  const rng = createSeededRandom(input.rng);
  let { state, deadline } = input;
  const events: v4.GameEvent[] = [];
  const key = (s: v4.MatchState) => `${s.status}:${s.turn}`;
  let lastKey = key(state);

  for (let guard = 0; guard < 300 && state.status !== "finished"; guard++) {
    // During mulligan, bots go first so a human is never waiting on them.
    const botMulligan = ([0, 1] as const).find(
      (i) => kinds[i] === "bot" && !state.players[i].mulliganDone,
    );
    const seat =
      state.status === "mulligan" && botMulligan !== undefined ? botMulligan : actingSeat(state);
    if (seat === null) break;
    const playerId = state.players[seat].playerId;
    let command: v4.Command | null = null;
    if (kinds[seat] === "bot") {
      // Bot turns are paced: one action per step; `deadline` holds the next step time.
      if (state.status === "active" && deadline !== null && now < deadline) break;
      const legal = v4.getLegalCommands(state, seat);
      const pick = v4.chooseBotCommand(v4.getPlayerView(state, seat), legal, rng);
      command =
        pick.type === "mulligan"
          ? { type: "mulligan", playerId, instanceIds: [] }
          : { ...pick, playerId };
    } else if (deadline !== null && now >= deadline) {
      command =
        state.status === "mulligan"
          ? { type: "mulligan", playerId, instanceIds: [] }
          : { type: "end_turn", playerId };
    }
    if (!command) break;
    const t = v4.applyCommand(state, command, rng);
    state = t.state;
    events.push(...t.events);
    if (key(state) !== lastKey) {
      lastKey = key(state);
      deadline = null;
    }
    const next = actingSeat(state);
    if (state.status === "active" && next !== null && kinds[next] === "bot") {
      deadline = now + BOT_STEP_MS;
      break;
    }
  }
  if (deadline === null && mode !== "pass_play" && state.status !== "finished") {
    const seat = actingSeat(state);
    if (seat !== null && kinds[seat] === "human") deadline = now + v4.RULESET_V4.turnTimeoutMs;
  }
  return { state, rng: rng.getState(), deadline, events };
}
