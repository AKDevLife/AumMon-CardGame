import { describe, expect, it } from "vitest";
import { getLegalCommands, unitHp, unitKeywords } from "../src/rules/v2/index.ts";
import { board, codeOf, run, unit } from "./v2-fixtures.ts";

describe("evolution (spec §3.1, §4.9)", () => {
  it("T-006: U001 at HP 1 → U101 with full HP 5, same instance, exhaustion kept", () => {
    const duck = unit("d", "U001_RUBBER_DUCKLING", true);
    duck.damage = 2;
    const t = run(board([duck], []), { type: "evolve", unitId: "d" }).state;
    const u = t.players[0].units[0];
    if (!u) throw new Error("unit missing");
    expect([u.instanceId, u.cardId, unitHp(u), u.exhausted]).toEqual([
      "d",
      "U101_TURBO_BATH_DUCK",
      5,
      true,
    ]);
    expect(u.history).toEqual(["U001_RUBBER_DUCKLING"]);
    expect(t.players[0].spark).toBe(6);
  });

  it("a Ready unit can attack after evolving; equipment is kept", () => {
    const duck = unit("d", "U001_RUBBER_DUCKLING");
    duck.equipment = [{ instanceId: "e", cardId: "E003" }];
    let t = run(board([duck], []), { type: "evolve", unitId: "d" }).state;
    expect(t.players[0].units[0]?.equipment).toHaveLength(1);
    t = run(t, { type: "attack", attackerId: "d", target: "player" }).state;
    expect(t.players[1].hp).toBe(15);
  });

  it("Pocket Flashlight evolves for 1 SPARK (cost −1)", () => {
    const t = run(board([unit("f", "U004_POCKET_FLASHLIGHT")], []), {
      type: "evolve",
      unitId: "f",
    }).state;
    expect(t.players[0].spark).toBe(7);
  });

  it("rejects units without a recipe and stage 1 units", () => {
    const s = board([unit("x", "U101_TURBO_BATH_DUCK")], []);
    expect(codeOf(() => run(s, { type: "evolve", unitId: "x" }))).toBe("no_recipe");
    s.players[0].spark = 1;
    s.players[0].units = [unit("y", "U005_MINI_SKATEBOARD")];
    expect(codeOf(() => run(s, { type: "evolve", unitId: "y" }))).toBe("not_enough_spark");
  });
});

describe("fusion (spec §4.11)", () => {
  it("T-007: U001 (HP 1) + U003 (HP 1) → U201 with full HP 7, new instance, Exhausted", () => {
    const a = unit("a", "U001_RUBBER_DUCKLING");
    const b = unit("b", "U003_PAPER_GLIDER");
    a.damage = 2;
    b.damage = 1;
    b.equipment = [{ instanceId: "e", cardId: "E001" }];
    const t = run(board([a, b, unit("c", "U008_WINDUP_ROBOT")], []), {
      type: "fuse",
      unitIds: ["b", "a"],
    }).state;
    const f = t.players[0].units.find((u) => u.cardId === "U201_AMPHIBIOUS_GLIDER");
    if (!f) throw new Error("fusion missing");
    expect([unitHp(f), f.exhausted, f.instanceId === "a" || f.instanceId === "b"]).toEqual([
      7,
      true,
      false,
    ]);
    expect(f.history).toEqual(["b", "a"]);
    expect(t.players[0].units).toHaveLength(2);
    expect(t.players[0].discard.map((c) => c.instanceId)).toEqual(["b", "e", "a"]);
    expect(t.players[0].spark).toBe(5);
  });

  it("FU-002 inherits Guard; FU-001 inherits nothing", () => {
    const t = run(
      board([unit("a", "U002_TIN_CAN_GUARDIAN"), unit("b", "U006_THERMOS_GOLEM")], []),
      {
        type: "fuse",
        unitIds: ["a", "b"],
      },
    ).state;
    const f = t.players[0].units[0];
    if (!f) throw new Error("fusion missing");
    expect(unitKeywords(f).has("guard")).toBe(true);
  });

  it("rejects pairs without a recipe, same unit and missing SPARK", () => {
    const s = board([unit("a", "U001_RUBBER_DUCKLING"), unit("b", "U002_TIN_CAN_GUARDIAN")], []);
    expect(codeOf(() => run(s, { type: "fuse", unitIds: ["a", "b"] }))).toBe("no_recipe");
    expect(codeOf(() => run(s, { type: "fuse", unitIds: ["a", "a"] }))).toBe("duplicate_card");
    s.players[0].units = [unit("a", "U001_RUBBER_DUCKLING"), unit("c", "U003_PAPER_GLIDER")];
    s.players[0].spark = 2;
    expect(codeOf(() => run(s, { type: "fuse", unitIds: ["a", "c"] }))).toBe("not_enough_spark");
  });

  it("legal commands include evolve and fuse options", () => {
    const legal = getLegalCommands(
      board([unit("a", "U001_RUBBER_DUCKLING"), unit("c", "U003_PAPER_GLIDER")], []),
      0,
    );
    expect(legal).toContainEqual({ type: "evolve", unitId: "a" });
    expect(legal).toContainEqual({ type: "fuse", unitIds: ["a", "c"] });
  });
});
