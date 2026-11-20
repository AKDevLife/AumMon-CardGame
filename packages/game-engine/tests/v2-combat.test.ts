import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  applyCommand,
  CommandError,
  getLegalCommands,
  initializeMatch,
  STARTER_DECK_V2,
  type Command,
  type MatchState,
  type UnitInstance,
} from "../src/rules/v2/index.ts";

const rng = () => createSeededRandom([5, 6, 7, 8]);

const unit = (instanceId: string, cardId: string, exhausted = false): UnitInstance => ({
  instanceId,
  cardId,
  damage: 0,
  exhausted,
  equipment: [],
  history: [],
  bonusKeywords: [],
  tempAtk: 0,
  boostUsed: false,
});

/** Active match where seat 0 ("me") is on turn with 8 SPARK. */
function board(mine: UnitInstance[], theirs: UnitInstance[]): MatchState {
  const r = rng();
  let s = initializeMatch(
    { playerIds: ["me", "foe"], decks: [STARTER_DECK_V2, STARTER_DECK_V2] },
    r,
  );
  s = applyCommand(s, { type: "mulligan", playerId: "me", instanceIds: [] }, r).state;
  s = applyCommand(s, { type: "mulligan", playerId: "foe", instanceIds: [] }, r).state;
  s.activeSeat = 0;
  s.phase = "main";
  s.players[0].spark = 8;
  s.players[0].units = mine;
  s.players[1].units = theirs;
  return s;
}

type Intent = Command extends infer C ? (C extends Command ? Omit<C, "playerId"> : never) : never;

const run = (s: MatchState, c: Intent) => applyCommand(s, { ...c, playerId: "me" }, rng());

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    if (e instanceof CommandError) return e.code;
    throw e;
  }
  return undefined;
}

describe("spec §6.6 scenario tests", () => {
  it("T-001 Haste: summoned U001 attacks at once, then is exhausted", () => {
    const s = board([], []);
    s.players[0].hand = [{ instanceId: "h", cardId: "U001_RUBBER_DUCKLING" }];
    let t = run(s, { type: "summon", instanceId: "h" }).state;
    t = run(t, { type: "attack", attackerId: "h", target: "player" }).state;
    expect(t.players[1].hp).toBe(18);
    expect(t.players[0].units[0]?.exhausted).toBe(true);
    expect(codeOf(() => run(t, { type: "attack", attackerId: "h", target: "player" }))).toBe(
      "unit_exhausted",
    );
  });

  it("T-002 Guard: a Ready U002 must be attacked first", () => {
    const s = board(
      [unit("a", "U008_WINDUP_ROBOT")],
      [unit("g", "U002_TIN_CAN_GUARDIAN"), unit("x", "U005_MINI_SKATEBOARD")],
    );
    expect(codeOf(() => run(s, { type: "attack", attackerId: "a", target: "x" }))).toBe(
      "guard_blocks",
    );
    expect(codeOf(() => run(s, { type: "attack", attackerId: "a", target: "player" }))).toBe(
      "guard_blocks",
    );
    expect(codeOf(() => run(s, { type: "attack", attackerId: "a", target: "g" }))).toBeUndefined();
  });

  it("T-003 Flying: non-flying U001 cannot attack U003", () => {
    const s = board([unit("a", "U001_RUBBER_DUCKLING")], [unit("f", "U003_PAPER_GLIDER")]);
    expect(codeOf(() => run(s, { type: "attack", attackerId: "a", target: "f" }))).toBe(
      "flying_target",
    );
  });

  it("T-004 Piercing: U101 (ATK 4) vs HP 2 → destroyed, 2 excess to player", () => {
    const def = unit("d", "U002_TIN_CAN_GUARDIAN");
    def.damage = 2;
    const t = run(board([unit("a", "U101_TURBO_BATH_DUCK")], [def]), {
      type: "attack",
      attackerId: "a",
      target: "d",
    });
    expect(t.state.players[1].units).toHaveLength(0);
    expect(t.state.players[1].hp).toBe(18);
    expect(t.state.players[1].discard.map((c) => c.instanceId)).toContain("d");
  });

  it("T-005 Boost: U005 pays 1 SPARK, ATK 3 → 5 until end of turn, once per turn", () => {
    let t = run(board([unit("b", "U005_MINI_SKATEBOARD")], []), {
      type: "boost",
      instanceId: "b",
    }).state;
    expect(t.players[0].spark).toBe(7);
    expect(codeOf(() => run(t, { type: "boost", instanceId: "b" }))).toBe("boost_used");
    t = run(t, { type: "attack", attackerId: "b", target: "player" }).state;
    expect(t.players[1].hp).toBe(15);
    t = run(t, { type: "end_turn" }).state;
    expect(t.players[0].units[0]?.tempAtk).toBe(0);
  });
});

describe("combat rules", () => {
  it("unit combat deals damage both ways at the same time", () => {
    const t = run(board([unit("a", "U008_WINDUP_ROBOT")], [unit("d", "U006_THERMOS_GOLEM")]), {
      type: "attack",
      attackerId: "a",
      target: "d",
    }).state;
    expect(t.players[0].units[0]?.damage).toBe(2);
    expect(t.players[1].units[0]?.damage).toBe(3);
  });

  it("both units can be destroyed; equipment goes to discard", () => {
    const a = unit("a", "U003_PAPER_GLIDER");
    a.equipment = [{ instanceId: "e", cardId: "E003" }];
    const t = run(board([a], [unit("d", "U003_PAPER_GLIDER")]), {
      type: "attack",
      attackerId: "a",
      target: "d",
    }).state;
    expect(t.players[0].units).toHaveLength(0);
    expect(t.players[1].units).toHaveLength(0);
    expect(t.players[0].discard.map((c) => c.instanceId)).toEqual(
      expect.arrayContaining(["a", "e"]),
    );
  });

  it("direct attack allowed when foe has units but no Ready Guard (R2-4)", () => {
    const s = board(
      [unit("a", "U008_WINDUP_ROBOT")],
      [unit("g", "U002_TIN_CAN_GUARDIAN", true), unit("x", "U005_MINI_SKATEBOARD")],
    );
    expect(run(s, { type: "attack", attackerId: "a", target: "player" }).state.players[1].hp).toBe(
      17,
    );
  });

  it("a flying Guard does not force non-flying attackers", () => {
    const g = unit("g", "U002_TIN_CAN_GUARDIAN");
    g.equipment = [{ instanceId: "e", cardId: "E001" }];
    const s = board([unit("a", "U008_WINDUP_ROBOT"), unit("f", "U003_PAPER_GLIDER")], [g]);
    expect(
      codeOf(() => run(s, { type: "attack", attackerId: "a", target: "player" })),
    ).toBeUndefined();
    expect(codeOf(() => run(s, { type: "attack", attackerId: "f", target: "player" }))).toBe(
      "guard_blocks",
    );
  });

  it("after attacking, Main Phase actions are closed (R2-6)", () => {
    const s = board([unit("a", "U008_WINDUP_ROBOT"), unit("b", "U005_MINI_SKATEBOARD")], []);
    s.players[0].hand = [{ instanceId: "h", cardId: "U001_RUBBER_DUCKLING" }];
    const t = run(s, { type: "attack", attackerId: "a", target: "player" }).state;
    expect(codeOf(() => run(t, { type: "summon", instanceId: "h" }))).toBe("wrong_phase");
    expect(codeOf(() => run(t, { type: "boost", instanceId: "b" }))).toBe("wrong_phase");
    expect(
      getLegalCommands(t, 0)
        .map((c) => c.type)
        .sort(),
    ).toEqual(["attack", "end_turn"]);
  });

  it("reaching 0 HP ends the match", () => {
    const s = board([unit("a", "U105_ROCKET_SKATEBOARD")], []);
    s.players[1].hp = 5;
    const t = run(s, { type: "attack", attackerId: "a", target: "player" }).state;
    expect(t.status).toBe("finished");
    expect(t.result).toEqual({ winner: 0 });
  });

  it("legal attacks respect Guard and Flying", () => {
    const s = board(
      [unit("a", "U001_RUBBER_DUCKLING")],
      [unit("g", "U002_TIN_CAN_GUARDIAN"), unit("f", "U003_PAPER_GLIDER")],
    );
    expect(getLegalCommands(s, 0).filter((c) => c.type === "attack")).toEqual([
      { type: "attack", attackerId: "a", target: "g" },
    ]);
  });
});
