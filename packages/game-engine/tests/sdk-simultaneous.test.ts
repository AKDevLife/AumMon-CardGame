import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  advance,
  deadlineAfterAct,
  GameRuleError,
  pendingSeatsOf,
  type GameModule,
  type Kind,
  type Runtime,
} from "../src/sdk/index.ts";

// Toy simultaneous game: each round every seat picks 1–3 (hidden), then a "show" phase ticks.
interface Toy {
  round: number;
  phase: "pick" | "show" | "done";
  picks: (number | null)[];
  scores: number[];
}
interface Cmd {
  pick: number;
}
type Ev = { type: "picked"; seat: number } | { type: "timeout"; seat: number } | { type: "shown" };

const PICK_MS = 20_000;
const SHOW_MS = 5_000;

const toy: GameModule<Toy, Cmd, Toy, Ev> = {
  id: "edo_battle",
  rulesetVersion: "test",
  minPlayers: 2,
  maxPlayers: 8,
  afkTimeouts: 2,
  start: (ids) => ({
    state: { round: 1, phase: "pick", picks: ids.map(() => null), scores: ids.map(() => 0) },
    events: [],
  }),
  actingSeat: () => null,
  pendingSeats: (s) =>
    s.phase === "pick" ? s.picks.flatMap((p, i) => (p === null ? [i] : [])) : [],
  seatCount: (s) => s.picks.length,
  timerKey: (s) => `${s.phase}:${String(s.round)}`,
  timeoutMs: (s) => (s.phase === "pick" ? PICK_MS : SHOW_MS),
  parseCommand: (raw) => raw as Cmd,
  apply: (s, seat, c) => {
    if (s.phase !== "pick" || s.picks[seat] !== null) throw new GameRuleError("not_pending");
    const picks = s.picks.map((p, i) => (i === seat ? c.pick : p));
    const all = picks.every((p) => p !== null);
    return {
      state: { ...s, picks, phase: all ? "show" : "pick" },
      events: [{ type: "picked", seat }],
    };
  },
  tick: (s) => {
    const scores = s.scores.map((x, i) => x + (s.picks[i] ?? 0));
    const done = s.round >= 2;
    return {
      state: {
        round: done ? s.round : s.round + 1,
        phase: done ? "done" : "pick",
        picks: s.picks.map(() => null),
        scores,
      },
      events: [{ type: "shown" }],
    };
  },
  timeoutCommands: () => [{ pick: 1 }],
  bot: () => ({ pick: 3 }),
  view: (s) => s,
  publicEvent: (e) => e,
  privateEvents: () => [],
  timeoutEvent: (seat) => ({ type: "timeout", seat }),
  isFinished: (s) => s.phase === "done",
  result: (s) => (s.phase === "done" ? { winners: [], scores: s.scores } : null),
  handCounts: (s) => s.picks.map(() => 0),
  round: (s) => s.round,
  phase: (s) => s.phase,
};

const humans: Kind[] = ["human", "human", "human"];
const T0 = 1_000_000;

function fresh(): Runtime<Toy> {
  return {
    state: toy.start(["a", "b", "c"], createSeededRandom([1, 2, 3, 4])).state,
    rng: createSeededRandom([1, 2, 3, 4]).getState(),
    deadline: null,
    timeouts: [0, 0, 0],
  };
}

type Rt = Runtime<Toy> & { events: Ev[] };

function act(rt: Runtime<Toy>, seat: number, pick: number, now: number): Rt {
  const t = toy.apply(rt.state, seat, { pick }, createSeededRandom(rt.rng));
  return advance(
    toy,
    { ...rt, state: t.state, deadline: deadlineAfterAct(toy, rt.state, t.state, rt.deadline) },
    humans,
    now,
    "online",
  );
}

describe("SDK simultaneous decisions", () => {
  it("starts one phase deadline and lists every seat as pending", () => {
    const rt = advance(toy, fresh(), humans, T0, "online");
    expect(rt.deadline).toBe(T0 + PICK_MS);
    expect(pendingSeatsOf(toy, rt.state)).toEqual([0, 1, 2]);
  });

  it("any pending seat may act in any order; the deadline is kept within the phase", () => {
    let rt = advance(toy, fresh(), humans, T0, "online");
    rt = act(rt, 2, 3, T0 + 1000);
    rt = act(rt, 0, 2, T0 + 2000);
    expect(pendingSeatsOf(toy, rt.state)).toEqual([1]);
    expect(rt.deadline).toBe(T0 + PICK_MS);
    expect(() => toy.apply(rt.state, 0, { pick: 1 }, createSeededRandom(rt.rng))).toThrow(
      GameRuleError,
    );
  });

  it("ends the phase early when the last seat acts, then ticks after its deadline", () => {
    let rt = advance(toy, fresh(), humans, T0, "online");
    for (const seat of [0, 1, 2]) rt = act(rt, seat, 2, T0 + 1000);
    expect(rt.state.phase).toBe("show");
    expect(rt.deadline).toBe(T0 + 1000 + SHOW_MS);
    rt = advance(toy, rt, humans, T0 + 1000 + SHOW_MS, "online");
    expect(rt.state).toMatchObject({ phase: "pick", round: 2, scores: [2, 2, 2] });
    expect(rt.deadline).toBe(T0 + 1000 + SHOW_MS + PICK_MS);
  });

  it("applies timeout defaults to every pending seat at the deadline and counts timeouts", () => {
    let rt = advance(toy, fresh(), humans, T0, "online");
    rt = act(rt, 1, 3, T0 + 500);
    const after = advance(toy, rt, humans, T0 + PICK_MS, "online");
    expect(after.events.filter((e) => e.type === "timeout").map((e) => e)).toEqual([
      { type: "timeout", seat: 0 },
      { type: "timeout", seat: 2 },
    ]);
    expect(after.timeouts).toEqual([1, 0, 1]);
    expect(after.state.phase).toBe("show");
    expect(after.state.picks).toEqual([1, 3, 1]);
  });

  it("does nothing before the deadline", () => {
    const rt = advance(toy, fresh(), humans, T0, "online");
    const same = advance(toy, rt, humans, T0 + PICK_MS - 1, "online");
    expect(same.events).toEqual([]);
    expect(same.state).toEqual(rt.state);
  });

  it("bots decide at once; AFK seats get timeouts until they act again", () => {
    const rt = advance(toy, fresh(), ["bot", "human", "bot"], T0, "online");
    expect(rt.state.picks).toEqual([3, null, 3]);
    expect(pendingSeatsOf(toy, rt.state)).toEqual([1]);
  });

  it("without bots, a server-played seat (player left) takes timeout defaults at once", () => {
    const noBots: typeof toy = Object.fromEntries(
      Object.entries(toy).filter(([k]) => k !== "bot"),
    ) as unknown as typeof toy;
    const rt = advance(noBots, fresh(), ["bot", "human", "human"], T0, "online");
    expect(rt.state.picks).toEqual([1, null, null]);
    expect(pendingSeatsOf(noBots, rt.state)).toEqual([1, 2]);
  });

  it("plays a whole match on timeouts alone", () => {
    let rt = advance(toy, fresh(), humans, T0, "online");
    let now = T0;
    for (let i = 0; i < 10 && !toy.isFinished(rt.state); i++) {
      now = rt.deadline ?? now;
      rt = advance(toy, rt, humans, now, "online");
    }
    expect(toy.result(rt.state)).toEqual({ winners: [], scores: [2, 2, 2] });
    expect(rt.deadline).toBeNull();
  });
});
