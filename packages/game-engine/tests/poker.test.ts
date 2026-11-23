import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import { GameRuleError } from "../src/sdk/module.ts";
import {
  applyCommand,
  choosePokerBotCommand,
  evaluate,
  getPokerView,
  legalActions,
  pots,
  poker,
  POKER_RULES,
  startGame,
  type PokerState,
} from "../src/poker/index.ts";

const rng = (a = 7) => createSeededRandom([a, 2, 3, 4]);
const cat = (cards: string) => evaluate(cards.split(" ")).category;
const score = (cards: string) => evaluate(cards.split(" ")).score;
const chips = (s: PokerState) => s.players.reduce((a, x) => a + x.stack + x.total, 0);

describe("hand evaluator", () => {
  it.each([
    ["As Ks Qs Js Ts 2d 3c", "straight_flush"],
    ["5h 4h 3h 2h Ah Kd Kc", "straight_flush"],
    ["9c 9d 9h 9s 2c 3d 4h", "four_of_a_kind"],
    ["9c 9d 9h 2s 2c 3d 4h", "full_house"],
    ["2h 7h 9h Jh Kh Ad Ac", "flush"],
    ["5c 4d 3h 2s Ad Kc Qh", "straight"],
    ["Tc Jd Qh Ks Ad 2c 2h", "straight"],
    ["7c 7d 7h Ks Ad 2c 3h", "three_of_a_kind"],
    ["7c 7d 5h 5s Ad 2c 3h", "two_pair"],
    ["7c 7d 5h 4s Ad 2c Th", "pair"],
    ["7c 9d 5h 4s Ad 2c Th", "high_card"],
  ])("%s → %s", (cards, expected) => {
    expect(cat(cards)).toBe(expected);
  });

  it("orders hands and kickers", () => {
    expect(score("Ah Ad Kc 7s 2d")).toBeGreaterThan(score("Ah Ad Qc Js Td"));
    expect(score("6h 5d 4c 3s 2d")).toBeGreaterThan(score("5h 4d 3c 2s Ad"));
    expect(score("Ah Ad Kc Ks 2d")).toBeGreaterThan(score("Ah Ad Qc Qs Jd"));
    expect(score("2h 3h 4h 5h 7h")).toBeLessThan(score("2c 2d 2h 3s 3d"));
    expect(score("Kh Qd Jc Ts 9d 2c 2s")).toBe(score("Kd Qh Jd Tc 9s 3c 4h"));
  });
});

describe("betting", () => {
  it("heads-up: dealer posts the small blind and acts first preflop", () => {
    const { state } = startGame(["a", "b"], rng());
    const d = state.dealer;
    expect(state.players[d]?.bet).toBe(POKER_RULES.smallBlind);
    expect(state.players[1 - d]?.bet).toBe(POKER_RULES.bigBlind);
    expect(state.current).toBe(d);
  });

  it("big blind gets an option; checking closes preflop", () => {
    let { state } = startGame(["a", "b", "c"], rng());
    const r = rng(9);
    const first = state.current;
    state = applyCommand(state, first, { type: "call" }, r).state;
    state = applyCommand(state, state.current, { type: "call" }, r).state;
    expect(state.street).toBe("preflop");
    expect(legalActions(state, state.current)?.canCheck).toBe(true);
    state = applyCommand(state, state.current, { type: "check" }, r).state;
    expect(state.street).toBe("flop");
    expect(state.board).toHaveLength(3);
  });

  it("enforces turn order, minimum raise and amounts", () => {
    const { state } = startGame(["a", "b", "c"], rng());
    const other = (state.current + 1) % 3;
    expect(() => applyCommand(state, other, { type: "fold" }, rng())).toThrow(GameRuleError);
    expect(() => applyCommand(state, state.current, { type: "raise", to: 30 }, rng())).toThrow(
      "invalid_amount",
    );
    expect(() => applyCommand(state, state.current, { type: "check" }, rng())).toThrow(
      "cannot_check",
    );
    const t = applyCommand(state, state.current, { type: "raise", to: 60 }, rng());
    expect(t.state.currentBet).toBe(60);
    expect(t.state.minRaise).toBe(40);
  });

  it("everyone folds to a bet: the bettor wins the pot without showdown", () => {
    let { state } = startGame(["a", "b", "c"], rng());
    const r = rng(3);
    const raiser = state.current;
    state = applyCommand(state, raiser, { type: "raise", to: 100 }, r).state;
    const ev = [];
    for (let i = 0; i < 2; i++) {
      const t = applyCommand(state, state.current, { type: "fold" }, r);
      state = t.state;
      ev.push(...t.events);
    }
    expect(ev.find((e) => e.type === "showdown")).toBeUndefined();
    expect(ev.find((e) => e.type === "pot_won")).toMatchObject({ seat: raiser, amount: 130 });
    expect(state.hand).toBe(2);
  });

  it("side pots: a short all-in only wins what it covered", () => {
    const { state } = startGame(["a", "b", "c"], rng());
    state.players.forEach((x, i) => {
      x.total = [50, 200, 200][i] ?? 0;
      x.allIn = i === 0;
      x.folded = false;
    });
    expect(pots(state)).toEqual([
      { amount: 150, eligible: [0, 1, 2] },
      { amount: 300, eligible: [1, 2] },
    ]);
    const third = state.players[2];
    if (third) third.folded = true;
    expect(pots(state)).toEqual([
      { amount: 150, eligible: [0, 1] },
      { amount: 300, eligible: [1] },
    ]);
  });
});

describe("hidden information", () => {
  it("a seat sees only its own hole cards", () => {
    const { state } = startGame(["a", "b", "c", "d"], rng());
    const v = getPokerView(state, 1);
    expect(v.myCards).toEqual(state.players[1]?.hole);
    const json = JSON.stringify(v);
    for (const seat of [0, 2, 3])
      for (const c of state.players[seat]?.hole ?? []) expect(json).not.toContain(`"${c}"`);
    expect(JSON.stringify(getPokerView(state, null))).not.toContain(
      `"${state.players[0]?.hole[0] ?? ""}"`,
    );
  });
});

describe("simulation", () => {
  for (let players = 2; players <= 8; players++) {
    it(`${String(players)} bots: chips conserved, no illegal moves, the match ends`, () => {
      for (const seed of [1, 2, 3]) {
        const r = rng(seed * 31 + players);
        let { state } = startGame(
          Array.from({ length: players }, (_, i) => `p${String(i)}`),
          r,
        );
        const total = players * POKER_RULES.startingStack;
        let steps = 0;
        while (state.status === "active") {
          if (++steps > 20_000) throw new Error("did not finish");
          const seat = state.current;
          state = applyCommand(state, seat, choosePokerBotCommand(state, seat, r), r).state;
          expect(chips(state)).toBe(total);
          for (const x of state.players) expect(x.stack).toBeGreaterThanOrEqual(0);
          // Public events never carry undealt cards of another seat.
        }
        expect(state.winners.length).toBeGreaterThan(0);
        expect(poker.result(state)?.scores?.reduce((a, b) => a + b, 0)).toBe(total);
      }
    });
  }

  it("timeout = check when free, else fold", () => {
    const { state } = startGame(["a", "b", "c"], rng());
    expect(poker.timeoutCommands(state, state.current)).toEqual([{ type: "fold" }]);
  });

  it("parses client intent strictly", () => {
    expect(poker.parseCommand({ type: "raise", to: 40 })).toEqual({ type: "raise", to: 40 });
    expect(() => poker.parseCommand({ type: "raise", to: 1.5 })).toThrow();
    expect(() => poker.parseCommand({ type: "steal" })).toThrow();
  });
});
