import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  applyCommand,
  CommandError,
  getLegalCommands,
  getPlayerView,
  initializeMatch,
  STARTER_DECK_V2,
  type MatchState,
  type Seat,
} from "../src/rules/v2/index.ts";

const rng = () => createSeededRandom([1, 2, 3, 4]);
const IDS = ["alice", "bob"] as const;
const fresh = () =>
  initializeMatch({ playerIds: IDS, decks: [STARTER_DECK_V2, STARTER_DECK_V2] }, rng());
const pid = (s: MatchState, seat: Seat) => s.players[seat].playerId;

function started(): MatchState {
  const r = rng();
  let s = fresh();
  for (const seat of [0, 1] as const)
    s = applyCommand(s, { type: "mulligan", playerId: pid(s, seat), instanceIds: [] }, r).state;
  return s;
}

const total = (s: MatchState, seat: Seat) => {
  const p = s.players[seat];
  return p.deck.length + p.hand.length + p.discard.length + p.units.length;
};

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    if (e instanceof CommandError) return e.code;
    throw e;
  }
  return undefined;
}

describe("ruleset 2 setup (spec §4.1)", () => {
  it("deals 5 cards, 20 HP, 30-card decks, waits for mulligan", () => {
    const s = fresh();
    expect(s.status).toBe("mulligan");
    for (const seat of [0, 1] as const) {
      expect(s.players[seat].hand).toHaveLength(5);
      expect(s.players[seat].hp).toBe(20);
      expect(total(s, seat)).toBe(30);
    }
  });

  it("is deterministic for the same seed", () => {
    expect(fresh()).toEqual(fresh());
  });

  it("picks the first player at random", () => {
    const firsts = new Set<number>();
    for (let i = 1; i <= 20; i++)
      firsts.add(
        initializeMatch(
          { playerIds: IDS, decks: [STARTER_DECK_V2, STARTER_DECK_V2] },
          createSeededRandom([i, 7, 9, 11]),
        ).firstSeat,
      );
    expect(firsts).toEqual(new Set([0, 1]));
  });
});

describe("mulligan", () => {
  it("replaces chosen cards once and keeps hand size", () => {
    const s = fresh();
    const hand = s.players[0].hand;
    const ids = hand.slice(0, 3).map((c) => c.instanceId);
    const t = applyCommand(
      s,
      { type: "mulligan", playerId: "alice", instanceIds: ids },
      rng(),
    ).state;
    expect(t.players[0].hand).toHaveLength(5);
    expect(total(t, 0)).toBe(30);
    expect(
      codeOf(() =>
        applyCommand(t, { type: "mulligan", playerId: "alice", instanceIds: [] }, rng()),
      ),
    ).toBe("mulligan_done");
  });

  it("rejects cards not in hand", () => {
    expect(
      codeOf(() =>
        applyCommand(
          fresh(),
          { type: "mulligan", playerId: "alice", instanceIds: ["nope"] },
          rng(),
        ),
      ),
    ).toBe("card_not_in_hand");
  });
});

describe("turns (spec §4.2, §4.5)", () => {
  it("first player starts with 1 SPARK and does not draw", () => {
    const s = started();
    const first = s.players[s.firstSeat];
    expect(s.status).toBe("active");
    expect([first.spark, first.maxSpark, first.hand.length]).toEqual([1, 1, 5]);
  });

  it("second player draws and gets 1 SPARK; SPARK grows to max 8", () => {
    let s = started();
    const r = rng();
    s = applyCommand(s, { type: "end_turn", playerId: pid(s, s.activeSeat) }, r).state;
    const second = s.players[s.activeSeat];
    expect([second.spark, second.hand.length]).toEqual([1, 6]);
    for (let i = 0; i < 20; i++)
      s = applyCommand(s, { type: "end_turn", playerId: pid(s, s.activeSeat) }, r).state;
    expect(s.players[0].maxSpark).toBe(8);
    expect(s.players[1].maxSpark).toBe(8);
  });

  it("rejects commands from the inactive player", () => {
    const s = started();
    const idle = s.activeSeat === 0 ? 1 : 0;
    expect(codeOf(() => applyCommand(s, { type: "end_turn", playerId: pid(s, idle) }, rng()))).toBe(
      "not_your_turn",
    );
  });
});

describe("summon (spec §4.6)", () => {
  function withHand(cardIds: string[]): MatchState {
    const s = started();
    const p = s.players[s.activeSeat];
    p.hand = cardIds.map((cardId, i) => ({ instanceId: `t${i}`, cardId }));
    p.spark = 8;
    return s;
  }

  it("summons exhausted unless Haste, and pays SPARK", () => {
    const s = withHand(["U002_TIN_CAN_GUARDIAN", "U001_RUBBER_DUCKLING"]);
    const id = pid(s, s.activeSeat);
    let t = applyCommand(s, { type: "summon", playerId: id, instanceId: "t0" }, rng()).state;
    t = applyCommand(t, { type: "summon", playerId: id, instanceId: "t1" }, rng()).state;
    const units = t.players[t.activeSeat].units;
    expect(units.map((u) => u.exhausted)).toEqual([true, false]);
    expect(t.players[t.activeSeat].spark).toBe(6);
  });

  it("enforces SPARK, unit type and 3-unit zone", () => {
    const s = withHand([
      "U004_POCKET_FLASHLIGHT",
      "A001",
      "U001_RUBBER_DUCKLING",
      "U002_TIN_CAN_GUARDIAN",
      "U003_PAPER_GLIDER",
      "U008_WINDUP_ROBOT",
    ]);
    const id = pid(s, s.activeSeat);
    expect(
      codeOf(() => applyCommand(s, { type: "summon", playerId: id, instanceId: "t1" }, rng())),
    ).toBe("not_a_unit");
    s.players[s.activeSeat].spark = 1;
    expect(
      codeOf(() => applyCommand(s, { type: "summon", playerId: id, instanceId: "t0" }, rng())),
    ).toBe("not_enough_spark");
    s.players[s.activeSeat].spark = 8;
    let t = s;
    for (const iid of ["t2", "t3", "t4"])
      t = applyCommand(t, { type: "summon", playerId: id, instanceId: iid }, rng()).state;
    expect(
      codeOf(() => applyCommand(t, { type: "summon", playerId: id, instanceId: "t5" }, rng())),
    ).toBe("unit_zone_full");
    expect(getLegalCommands(t, t.activeSeat).some((c) => c.type === "summon")).toBe(false);
  });

  it("units ready again at their owner's next Start Phase", () => {
    const s = withHand(["U002_TIN_CAN_GUARDIAN"]);
    const seat = s.activeSeat;
    let t = applyCommand(
      s,
      { type: "summon", playerId: pid(s, seat), instanceId: "t0" },
      rng(),
    ).state;
    t = applyCommand(t, { type: "end_turn", playerId: pid(t, seat) }, rng()).state;
    t = applyCommand(t, { type: "end_turn", playerId: pid(t, t.activeSeat) }, rng()).state;
    expect(t.players[seat].units[0]?.exhausted).toBe(false);
  });
});

describe("draw limits and end (spec §4.8, R2-3)", () => {
  it("burns the draw when hand has 10 cards", () => {
    const s = started();
    const nextSeat = s.activeSeat === 0 ? 1 : 0;
    const p = s.players[nextSeat];
    while (p.hand.length < 10) {
      const c = p.deck.shift();
      if (c) p.hand.push(c);
    }
    const t = applyCommand(s, { type: "end_turn", playerId: pid(s, s.activeSeat) }, rng());
    expect(t.state.players[nextSeat].hand).toHaveLength(10);
    expect(t.state.players[nextSeat].discard).toHaveLength(1);
    expect(t.events.some((e) => e.type === "card_burned")).toBe(true);
  });

  it("fatigue deals 1, 2, 3… and ends the match at 0 HP", () => {
    const s = started();
    const seat = s.activeSeat === 0 ? 1 : 0;
    s.players[seat].deck = [];
    s.players[seat].hp = 3;
    const r = rng();
    let t = applyCommand(s, { type: "end_turn", playerId: pid(s, s.activeSeat) }, r).state;
    expect(t.players[seat].hp).toBe(2);
    t = applyCommand(t, { type: "end_turn", playerId: pid(t, t.activeSeat) }, r).state;
    t = applyCommand(t, { type: "end_turn", playerId: pid(t, t.activeSeat) }, r).state;
    expect(t.players[seat].hp).toBe(0);
    expect(t.status).toBe("finished");
    expect(t.result).toEqual({ winner: seat === 0 ? 1 : 0 });
    expect(codeOf(() => applyCommand(t, { type: "end_turn", playerId: "alice" }, r))).toBe(
      "match_finished",
    );
  });

  it("forfeit gives the win to the opponent", () => {
    const t = applyCommand(started(), { type: "forfeit", playerId: "alice" }, rng()).state;
    expect(t.result).toEqual({ winner: 1 });
  });
});

describe("player view", () => {
  it("hides opponent hand and deck order", () => {
    const s = started();
    const v = getPlayerView(s, 0);
    expect(v.myHand).toEqual(s.players[0].hand);
    expect(JSON.stringify(v)).not.toContain(s.players[1].hand[0]?.instanceId ?? "x");
    expect(v.players[1].handCount).toBe(s.players[1].hand.length);
    expect(v.players[0]).not.toHaveProperty("deck");
    expect(v.players[1]).not.toHaveProperty("hand");
  });

  it("does not mutate the input state", () => {
    const s = started();
    const before = JSON.stringify(s);
    applyCommand(s, { type: "end_turn", playerId: pid(s, s.activeSeat) }, rng());
    expect(JSON.stringify(s)).toBe(before);
  });
});
