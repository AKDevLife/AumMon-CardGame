import { describe, expect, it } from "vitest";
import { assertCharacterSupported, CharacterConfigError } from "../src/characters/registry.ts";
import { getLegalActions, validateAction } from "../src/rules/v1/actions.ts";
import { CHARACTERS } from "./fixtures.ts";
import { command, selectState } from "./scenario.ts";

const base = () =>
  selectState(
    ["pyro_pup", "aqua_otter", "breeze_kit"],
    [["attack", "support", "defense"], ["aoe"], ["redirect"]],
  );

describe("character registry (3.4)", () => {
  it("accepts the four starters", () => {
    for (const c of Object.values(CHARACTERS))
      expect(() => {
        assertCharacterSupported(c);
      }).not.toThrow();
  });
  it("rejects unknown effectKey or mismatched hook", () => {
    const pyro = CHARACTERS["pyro_pup"];
    if (!pyro) throw new Error("fixture");
    expect(() => {
      assertCharacterSupported({ ...pyro, effectKey: "NOPE" });
    }).toThrow(CharacterConfigError);
    expect(() => {
      assertCharacterSupported({ ...pyro, hook: "onRoundEnd" });
    }).toThrow(/requires hook onAttack/);
  });
});

describe("validateAction (3.5)", () => {
  it("accepts a valid attack", () => {
    const s = base();
    const r = validateAction(s, "p1", command(s, "p1", "attack", { targetPlayerId: "p2" }));
    expect(r).toMatchObject({ ok: true, action: { targetPlayerId: "p2" } });
  });

  it.each([
    ["self target", "attack", { targetPlayerId: "p1" }, "invalid_target"],
    ["missing target", "attack", {}, "invalid_target"],
    ["target on defense", "defense", { targetPlayerId: "p2" }, "invalid_target"],
    ["support without choice", "support", {}, "invalid_choice"],
    ["support bad choice", "support", { choice: "steal" }, "invalid_choice"],
    ["choice on attack", "attack", { targetPlayerId: "p2", choice: "heal" }, "invalid_choice"],
  ] as const)("rejects %s", (_n, effect, extra, code) => {
    const s = base();
    expect(validateAction(s, "p1", command(s, "p1", effect, extra))).toMatchObject({
      ok: false,
      code,
    });
  });

  it("rejects cards not in own hand, stale version/round, eliminated and duplicate", () => {
    const s = base();
    const foreign = { ...command(s, "p2", "aoe") };
    expect(validateAction(s, "p1", foreign)).toMatchObject({ code: "card_not_in_hand" });
    expect(
      validateAction(s, "p1", { ...command(s, "p1", "defense"), expectedVersion: 99 }),
    ).toMatchObject({ code: "version_conflict" });
    expect(
      validateAction(s, "p1", { ...command(s, "p1", "defense"), roundNumber: 9 }),
    ).toMatchObject({ code: "wrong_round" });
    expect(validateAction(s, "zz", command(s, "p1", "defense"))).toMatchObject({
      code: "not_a_player",
    });
    const dead = base();
    const p3 = dead.players[2];
    if (p3) p3.status = "eliminated";
    expect(
      validateAction(dead, "p1", command(dead, "p1", "attack", { targetPlayerId: "p3" })),
    ).toMatchObject({ code: "invalid_target" });
    s.submissions["p1"] = { playerId: "p1", cardInstanceId: "x" };
    expect(validateAction(s, "p1", command(s, "p1", "defense"))).toMatchObject({
      code: "already_submitted",
    });
    const wrongPhase = { ...base(), phase: "draw" as const };
    expect(validateAction(wrongPhase, "p1", command(wrongPhase, "p1", "defense"))).toMatchObject({
      code: "wrong_phase",
    });
  });

  it("allows heal at full HP (clarification Q6)", () => {
    const s = base();
    expect(validateAction(s, "p1", command(s, "p1", "support", { choice: "heal" })).ok).toBe(true);
  });
});

describe("getLegalActions (3.5)", () => {
  it("enumerates targets and choices", () => {
    const actions = getLegalActions(base(), "p1");
    expect(actions.filter((a) => a.effect === "attack").map((a) => a.targetPlayerId)).toEqual([
      "p2",
      "p3",
    ]);
    expect(actions.filter((a) => a.effect === "support").map((a) => a.choice)).toEqual([
      "heal",
      "draw",
    ]);
    expect(actions.filter((a) => a.effect === "defense")).toHaveLength(1);
  });
  it("is empty outside select or after submitting", () => {
    const s = base();
    s.submissions["p1"] = { playerId: "p1", cardInstanceId: "x" };
    expect(getLegalActions(s, "p1")).toEqual([]);
    expect(getLegalActions({ ...base(), phase: "draw" }, "p1")).toEqual([]);
  });
});
