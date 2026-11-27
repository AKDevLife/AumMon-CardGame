import { createSeededRandom, type RngState } from "../rng/seeded-random.ts";
import type { RandomSource } from "../rng/seeded-random.ts";
import type { GameModule, Seat } from "./module.ts";

/**
 * Platform match flow (pure, `now` injected): paced server bots + decision timers for any game.
 * Generalised from the EDO Battle flow without behaviour change (golden + flow tests).
 */
export type Kind = "human" | "bot";
export type Mode = "solo" | "online" | "quick_match";

export interface Runtime<S> {
  state: S;
  rng: RngState;
  deadline: number | null;
  /** Consecutive timeouts per seat (Online: ≥ afkTimeouts → the server plays that seat). */
  timeouts: number[];
}

/** Pause between server-bot actions so players can follow each move. */
export const BOT_STEP_MS = 700;
/** A command received up to this long after the deadline is still accepted (network). */
export const GRACE_MS = 500;

const isOnline = (mode: Mode) => mode !== "solo";

/** Seats the server plays now: bots, and online humans who timed out too often. */
export function effectiveKinds(
  kinds: readonly Kind[],
  timeouts: readonly number[],
  mode: Mode,
  afkTimeouts: number,
): Kind[] {
  return kinds.map((k, i) =>
    k === "human" && isOnline(mode) && (timeouts[i] ?? 0) >= afkTimeouts ? "bot" : k,
  );
}

type AnyModule<S, C, V, E extends { readonly type: string }> = GameModule<S, C, V, E>;

/** Seats that may act now: `pendingSeats` for simultaneous modules, else the acting seat. */
export function pendingSeatsOf<S, C, V, E extends { readonly type: string }>(
  game: AnyModule<S, C, V, E>,
  state: S,
): Seat[] {
  if (game.isFinished(state)) return [];
  if (game.pendingSeats) return game.pendingSeats(state);
  const seat = game.actingSeat(state);
  return seat === null ? [] : [seat];
}

export function seatCountOf<S, C, V, E extends { readonly type: string }>(
  game: AnyModule<S, C, V, E>,
  state: S,
): number {
  return game.seatCount ? game.seatCount(state) : game.handCounts(state).length;
}

function botCommand<S, C, V, E extends { readonly type: string }>(
  game: AnyModule<S, C, V, E>,
  state: S,
  seat: Seat,
  rng: RandomSource,
): C {
  if (!game.bot) throw new Error(`${game.id} has no bots`);
  return game.bot(state, seat, rng);
}

/** Keep the timer only while the same seat is still on the same decision. */
export function deadlineAfterAct<S, C, V, E extends { readonly type: string }>(
  game: GameModule<S, C, V, E>,
  before: S,
  after: S,
  deadline: number | null,
): number | null {
  // Simultaneous phases keep one deadline for the whole phase, however many seats acted.
  const same =
    !game.isFinished(after) &&
    (game.pendingSeats !== undefined || game.actingSeat(after) === game.actingSeat(before)) &&
    game.timerKey(after) === game.timerKey(before);
  return same ? deadline : null;
}

/** Runs bots and timeouts until a human must act. */
export function advance<S, C, V, E extends { readonly type: string }>(
  game: GameModule<S, C, V, E>,
  input: Runtime<S>,
  kinds: readonly Kind[],
  now: number,
  mode: Mode = "solo",
): Runtime<S> & { events: E[] } {
  if (game.pendingSeats) return advanceSimultaneous(game, input, kinds, now);
  const rng = createSeededRandom(input.rng);
  let { state, deadline } = input;
  const seats = seatCountOf(game, state);
  const timeouts = Array.from({ length: seats }, (_, i) => input.timeouts[i] ?? 0);
  const events: E[] = [];
  const key = (s: S) => `${String(game.isFinished(s))}:${game.timerKey(s)}`;
  let lastKey = key(state);
  const kindAt = (seat: Seat) => effectiveKinds(kinds, timeouts, mode, game.afkTimeouts)[seat];

  for (let guard = 0; guard < 300 && !game.isFinished(state); guard++) {
    const seat = game.actingSeat(state);
    if (seat === null) break;
    let commands: C[] = [];
    let timedOut = false;
    if (kindAt(seat) === "bot") {
      if (deadline !== null && now < deadline) break;
      commands = [botCommand(game, state, seat, rng)];
    } else if (deadline !== null && now >= deadline) {
      commands = game.timeoutCommands(state, seat);
      timedOut = true;
      events.push(game.timeoutEvent(seat));
      timeouts[seat] = (timeouts[seat] ?? 0) + 1;
    }
    if (commands.length === 0) break;
    for (const command of commands) {
      const t = game.apply(state, seat, command, rng);
      state = t.state;
      events.push(...t.events);
      if (timedOut) {
        const follow = game.afterTimeout?.(state, seat) ?? null;
        if (follow !== null) commands.push(follow);
      }
    }
    if (key(state) !== lastKey) {
      lastKey = key(state);
      deadline = null;
    }
    const next = game.actingSeat(state);
    if (next !== null && kindAt(next) === "bot") {
      deadline = now + BOT_STEP_MS;
      break;
    }
  }
  if (deadline === null && !game.isFinished(state)) {
    const seat = game.actingSeat(state);
    if (seat !== null && kindAt(seat) === "human") deadline = now + game.timeoutMs(state);
  }
  const floor = game.minDecision?.(state) ?? null;
  if (floor && deadline !== null && kindAt(floor.seat) === "human")
    deadline = Math.max(deadline, now + floor.ms);
  return { state, rng: rng.getState(), deadline, timeouts, events };
}

/**
 * Multi-seat path: every pending seat decides in the same phase under one deadline.
 * Bots act at once; at the deadline each pending human gets its timeout defaults (seat order);
 * a phase without pending seats moves on through `tick` when its deadline passes.
 */
function advanceSimultaneous<S, C, V, E extends { readonly type: string }>(
  game: GameModule<S, C, V, E>,
  input: Runtime<S>,
  kinds: readonly Kind[],
  now: number,
): Runtime<S> & { events: E[] } {
  const rng = createSeededRandom(input.rng);
  let { state, deadline } = input;
  const seats = seatCountOf(game, state);
  const timeouts = Array.from({ length: seats }, (_, i) => input.timeouts[i] ?? 0);
  const events: E[] = [];
  const key = (s: S) => `${String(game.isFinished(s))}:${game.timerKey(s)}`;
  // Simultaneous games: an AFK human keeps getting timeout defaults, never a bot takeover (M2);
  // only real bot seats (filled seats, players who left) are played by the server.
  const kindAt = (seat: Seat) => kinds[seat];
  const run = (seat: Seat, command: C) => {
    const t = game.apply(state, seat, command, rng);
    state = t.state;
    events.push(...t.events);
  };

  for (let guard = 0; guard < 300 && !game.isFinished(state); guard++) {
    const before = key(state);
    const pending = pendingSeatsOf(game, state);
    const bots = pending.filter((seat) => kindAt(seat) === "bot");
    const due = deadline !== null && now >= deadline;
    if (bots.length > 0) {
      // Games without bots: a seat the server plays (player left) takes its timeout defaults at once.
      for (const seat of bots)
        if (game.bot) run(seat, botCommand(game, state, seat, rng));
        else for (const command of game.timeoutCommands(state, seat)) run(seat, command);
    } else if (pending.length > 0 && due) {
      for (const seat of pending) {
        events.push(game.timeoutEvent(seat));
        timeouts[seat] = (timeouts[seat] ?? 0) + 1;
        for (const command of game.timeoutCommands(state, seat)) run(seat, command);
      }
    } else if (pending.length === 0 && due && game.tick) {
      const t = game.tick(state, rng);
      state = t.state;
      events.push(...t.events);
    } else break;
    if (key(state) !== before) deadline = null;
  }
  if (deadline === null && !game.isFinished(state)) deadline = now + game.timeoutMs(state);
  return { state, rng: rng.getState(), deadline, timeouts, events };
}
