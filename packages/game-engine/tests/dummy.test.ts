import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import { sdk } from "../src/index.ts";
import {
  applyCommand,
  cardPoints,
  chooseDummyBotCommand,
  dummy,
  getDummyView,
  isValidMeld,
  startGame,
  type DummyState,
} from "../src/dummy/index.ts";

const rng = (a = 5) => createSeededRandom([a, 9, 8, 7]);
const all = (s: DummyState) => [
  ...s.stock,
  ...s.discard,
  ...s.melds.flatMap((m) => m.cards),
  ...s.players.flatMap((p) => p.hand),
];

/** Fixed 2-player table: p0 to draw. */
function table(
  hands: string[][],
  discard: string[],
  stock: string[] = ["9h", "9d", "9s"],
): DummyState {
  const { state } = startGame(["a", "b"], rng());
  state.players.forEach((p, i) => (p.hand = [...(hands[i] ?? [])]));
  state.discard = [...discard];
  state.discardFrom = discard.map(() => [-1, 0]);
  state.head = discard[0] ?? "";
  state.stock = [...stock];
  state.current = 0;
  state.phase = "draw";
  return state;
}

describe("melds", () => {
  it.each([
    [["7c", "7d", "7h"], true],
    [["7c", "7d", "7h", "7s"], true],
    [["3h", "4h", "5h"], true],
    [["Ah", "2h", "3h"], true],
    [["Qh", "Kh", "Ah"], true],
    [["Kh", "Ah", "2h"], false],
    [["3h", "4h", "6h"], false],
    [["3h", "4h", "5d"], false],
    [["7c", "7d"], false],
  ])("%j valid = %s", (cards, ok) => {
    expect(isValidMeld(cards)).toBe(ok);
  });

  it("card points: speto 50, A 15, faces 10, small 5", () => {
    expect([
      cardPoints("2c"),
      cardPoints("Qs"),
      cardPoints("Ad"),
      cardPoints("Kd"),
      cardPoints("4h"),
    ]).toEqual([50, 50, 15, 10, 5]);
  });
});

describe("turns", () => {
  it("draw then discard passes the turn", () => {
    let s = table(
      [
        ["2d", "5h", "Kc"],
        ["3s", "8d", "Jc"],
      ],
      ["4c"],
    );
    s = applyCommand(s, 0, { type: "draw" }).state;
    expect(s.phase).toBe("play");
    expect(() => applyCommand(s, 0, { type: "draw" })).toThrow("already_drew");
    s = applyCommand(s, 0, { type: "discard", card: "Kc" }).state;
    expect(s.current).toBe(1);
    expect(s.discard.at(-1)).toBe("Kc");
  });

  it("picking from the pile takes every card above and must meld the picked card", () => {
    const s = table([["5c", "6c", "Kd"], ["3s"]], ["4c", "9d", "Jh"]);
    expect(() => applyCommand(s, 0, { type: "pick", index: 0 })).toThrow("pick_needs_meld");
    expect(() => applyCommand(s, 0, { type: "pick", index: 0, meld: ["4c", "6c", "Kd"] })).toThrow(
      "invalid_meld",
    );
    const t = applyCommand(s, 0, { type: "pick", index: 0, meld: ["4c", "5c", "6c"] });
    expect(t.state.players[0]?.hand.sort()).toEqual(["9d", "Jh", "Kd"].sort());
    expect(t.state.discard).toEqual([]);
    // Head card bonus (50) + meld points 15.
    expect(t.state.players[0]?.points).toBe(65);
    expect(t.events.find((e) => e.type === "picked")).toMatchObject({ head: true });
  });

  it.each([
    ["5s", 50],
    ["2s", 50],
  ])("ทิ้งโง่: another player melds my discard %s within the lap → −%i", (card, penalty) => {
    let s = table(
      [
        [card, "Kd", "8h"],
        ["3s", "4s", "Jc"],
      ],
      ["9d"],
      ["2d", "Td"],
    );
    s = applyCommand(s, 0, { type: "draw" }).state;
    s = applyCommand(s, 0, { type: "discard", card }).state;
    const t = applyCommand(s, 1, { type: "pick", index: 1, meld: [card, "3s", "4s"] });
    expect(t.state.players[0]?.points).toBe(-penalty);
    expect(t.events).toContainEqual({ type: "fed", seat: 0, card, penalty });
  });

  it("ทิ้งโง่: speto costs 100", () => {
    let s = table(
      [
        ["Qs", "Kd", "8h"],
        ["Js", "Ks", "4c"],
      ],
      ["9d"],
      ["2d", "Td"],
    );
    s = applyCommand(s, 0, { type: "draw" }).state;
    s = applyCommand(s, 0, { type: "discard", card: "Qs" }).state;
    const t = applyCommand(s, 1, { type: "pick", index: 1, meld: ["Qs", "Js", "Ks"] });
    expect(t.state.players[0]?.points).toBe(-100);
  });

  it("ทิ้งโง่: no penalty once the discarder has played again", () => {
    let s = table(
      [
        ["5s", "Kd", "8h", "9h"],
        ["3s", "4s", "Jc", "Qc"],
      ],
      ["9d"],
      ["2d", "Td", "6d", "7d"],
    );
    s = applyCommand(s, 0, { type: "draw" }).state;
    s = applyCommand(s, 0, { type: "discard", card: "5s" }).state;
    s = applyCommand(s, 1, { type: "draw" }).state;
    s = applyCommand(s, 1, { type: "discard", card: "Jc" }).state;
    s = applyCommand(s, 0, { type: "draw" }).state;
    s = applyCommand(s, 0, { type: "discard", card: "Kd" }).state;
    const t = applyCommand(s, 1, { type: "pick", index: 1, meld: ["5s", "3s", "4s"] });
    expect(t.state.players[0]?.points).toBe(0);
    expect(t.events.some((e) => e.type === "fed")).toBe(false);
  });

  it("knock: discarding the last card ends the round with the knock bonus", () => {
    let s = table(
      [
        ["5c", "6c", "7c", "Kd"],
        ["As", "2c"],
      ],
      ["Jh"],
      ["4d", "8c"],
    );
    s = applyCommand(s, 0, { type: "draw" }).state; // 8c
    s = applyCommand(s, 0, { type: "meld", cards: ["5c", "6c", "7c", "8c"] }).state;
    const t = applyCommand(s, 0, { type: "discard", card: "Kd" });
    expect(t.state.status).toBe("finished");
    expect(t.state.knocker).toBe(0);
    expect(t.state.scores).toEqual([20 + 50, -65]);
  });

  it("stock out: melded minus hand points", () => {
    let s = table(
      [
        ["5c", "6c", "7c", "Kd"],
        ["As", "2c"],
      ],
      ["Jh"],
      ["4d", "Kh"],
    );
    s = applyCommand(s, 0, { type: "draw" }).state; // Kh
    s = applyCommand(s, 0, { type: "meld", cards: ["5c", "6c", "7c"] }).state;
    s = applyCommand(s, 0, { type: "discard", card: "Kd" }).state;
    expect(s.status).toBe("active");
    // p1 draws 4d, discards; p0 then has Kh only and must draw — stock empty ends the round.
    s = applyCommand(s, 1, { type: "draw" }).state;
    s = applyCommand(s, 1, { type: "discard", card: "4d" }).state;
    expect(s.status).toBe("finished");
    // p0: 15 melded − Kh 10 = 5; p1: −(As 15 + 2c speto 50) = −65.
    expect(s.scores).toEqual([5, -65]);
    expect(s.winners).toEqual([0]);
  });
});

describe("hidden information", () => {
  it("a seat sees only its own hand", () => {
    const { state } = startGame(["a", "b", "c"], rng());
    const v = JSON.stringify(getDummyView(state, 0));
    for (const c of [
      ...(state.players[1]?.hand ?? []),
      ...(state.players[2]?.hand ?? []),
      ...state.stock,
    ])
      expect(v).not.toContain(`"${c}"`);
  });
});

describe("simulation", () => {
  for (const players of [2, 3, 4]) {
    it(`${String(players)} bots: 52 cards conserved, no illegal moves, the round ends`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const r = rng(seed * 13 + players);
        let { state } = startGame(
          Array.from({ length: players }, (_, i) => `p${String(i)}`),
          r,
        );
        let steps = 0;
        while (state.status === "active") {
          if (++steps > 2000) throw new Error("did not finish");
          state = applyCommand(
            state,
            state.current,
            chooseDummyBotCommand(state, state.current),
          ).state;
          expect(new Set(all(state)).size).toBe(52);
          expect(all(state)).toHaveLength(52);
        }
        expect(state.scores).toHaveLength(players);
        expect(state.winners.length).toBeGreaterThan(0);
      }
    });
  }

  it("platform flow plays timeouts as draw + discard", () => {
    const { state } = startGame(["a", "b"], rng());
    const rt = sdk.advance(
      dummy,
      { state, rng: [1, 2, 3, 4], deadline: 0, timeouts: [] },
      ["human", "human"],
      1,
    );
    expect(rt.state.current).not.toBe(state.current);
    expect(rt.events.map((e) => e.type)).toEqual(["timeout", "drew", "discarded"]);
  });
});
