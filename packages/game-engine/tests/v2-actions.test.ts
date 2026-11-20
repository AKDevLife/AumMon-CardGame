import { describe, expect, it } from "vitest";
import { getLegalCommands, unitAtk, unitKeywords, unitMaxHp } from "../src/rules/v2/index.ts";
import { board, codeOf, run, unit } from "./v2-fixtures.ts";

const hand = (...cardIds: string[]) =>
  cardIds.map((cardId, i) => ({ instanceId: `h${i}`, cardId }));

describe("actions (spec §6.5.4)", () => {
  it("Quick Doodle draws 2 and goes to discard", () => {
    const s = board([], []);
    s.players[0].hand = hand("A001");
    const deck = s.players[0].deck.length;
    const t = run(s, { type: "play_action", instanceId: "h0" }).state;
    expect(t.players[0].hand).toHaveLength(2);
    expect(t.players[0].deck).toHaveLength(deck - 2);
    expect(t.players[0].discard.map((c) => c.cardId)).toEqual(["A001"]);
    expect(t.players[0].spark).toBe(7);
  });

  it("Lost & Found takes the chosen equipment, reveals it and shuffles (R2-7)", () => {
    const s = board([], []);
    s.players[0].hand = hand("A002");
    const r = run(s, { type: "play_action", instanceId: "h0", choice: "E002" });
    expect(r.state.players[0].hand.map((c) => c.cardId)).toEqual(["E002"]);
    expect(r.events).toContainEqual(
      expect.objectContaining({ type: "card_searched", cardId: "E002" }),
    );
    expect(
      codeOf(() =>
        run(s, { type: "play_action", instanceId: "h0", choice: "U001_RUBBER_DUCKLING" }),
      ),
    ).toBe("invalid_choice");
  });

  it("Scrap Return brings an equipment back from discard", () => {
    const s = board([], []);
    s.players[0].hand = hand("A003");
    s.players[0].discard = [{ instanceId: "d1", cardId: "E003" }];
    const t = run(s, { type: "play_action", instanceId: "h0", choice: "d1" }).state;
    expect(t.players[0].hand.map((c) => c.instanceId)).toEqual(["d1"]);
    expect(t.players[0].discard.map((c) => c.cardId)).toEqual(["A003"]);
  });

  it("actions without a valid target cannot be played (R2-8)", () => {
    const s = board([], []);
    s.players[0].hand = hand("A003", "A002");
    s.players[0].deck = s.players[0].deck.filter((c) => !c.cardId.startsWith("E"));
    expect(codeOf(() => run(s, { type: "play_action", instanceId: "h0", choice: "x" }))).toBe(
      "no_valid_target",
    );
    expect(codeOf(() => run(s, { type: "play_action", instanceId: "h1", choice: "E001" }))).toBe(
      "no_valid_target",
    );
    expect(getLegalCommands(s, 0).some((c) => c.type === "play_action")).toBe(false);
  });

  it("actions need SPARK and Main Phase", () => {
    const s = board([unit("a", "U008_WINDUP_ROBOT")], []);
    s.players[0].hand = hand("A001");
    s.players[0].spark = 0;
    expect(codeOf(() => run(s, { type: "play_action", instanceId: "h0" }))).toBe(
      "not_enough_spark",
    );
    s.players[0].spark = 5;
    const t = run(s, { type: "attack", attackerId: "a", target: "player" }).state;
    expect(codeOf(() => run(t, { type: "play_action", instanceId: "h0" }))).toBe("wrong_phase");
  });
});

describe("equipment (spec §4.10)", () => {
  it("E002 adds +2 HP, E003 +1 ATK, E001 grants Flying", () => {
    const s = board([unit("g", "U006_THERMOS_GOLEM"), unit("t", "U001_RUBBER_DUCKLING")], []);
    s.players[0].hand = hand("E002", "E003", "E001");
    let t = run(s, { type: "attach", instanceId: "h0", unitId: "g" }).state;
    t = run(t, { type: "attach", instanceId: "h1", unitId: "g" }).state;
    t = run(t, { type: "attach", instanceId: "h2", unitId: "t" }).state;
    const [g, duck] = t.players[0].units;
    if (!g || !duck) throw new Error("units missing");
    expect([unitAtk(g), unitMaxHp(g)]).toEqual([3, 7]);
    expect(unitKeywords(duck).has("flying")).toBe(true);
    expect(t.players[0].spark).toBe(5);
  });

  it("checks compatibility; Battery Buddy accepts any equipment", () => {
    const s = board([unit("t", "U001_RUBBER_DUCKLING"), unit("b", "U007_BATTERY_BUDDY")], []);
    s.players[0].hand = hand("E002", "E002");
    expect(codeOf(() => run(s, { type: "attach", instanceId: "h0", unitId: "t" }))).toBe(
      "incompatible",
    );
    expect(codeOf(() => run(s, { type: "attach", instanceId: "h0", unitId: "b" }))).toBeUndefined();
  });

  it("allows at most 2 slots per unit", () => {
    const s = board([unit("u", "U008_WINDUP_ROBOT")], []);
    s.players[0].hand = hand("E003", "E003", "E003");
    let t = run(s, { type: "attach", instanceId: "h0", unitId: "u" }).state;
    t = run(t, { type: "attach", instanceId: "h1", unitId: "u" }).state;
    expect(codeOf(() => run(t, { type: "attach", instanceId: "h2", unitId: "u" }))).toBe(
      "no_free_slot",
    );
  });

  it("rejects non-equipment and unknown units", () => {
    const s = board([unit("u", "U008_WINDUP_ROBOT")], []);
    s.players[0].hand = hand("A001", "E003");
    expect(codeOf(() => run(s, { type: "attach", instanceId: "h0", unitId: "u" }))).toBe(
      "not_equipment",
    );
    expect(codeOf(() => run(s, { type: "attach", instanceId: "h1", unitId: "zz" }))).toBe(
      "unknown_unit",
    );
  });

  it("legal commands list attach targets and action choices", () => {
    const s = board([unit("t", "U001_RUBBER_DUCKLING")], []);
    s.players[0].hand = hand("E002", "E003", "A001");
    const legal = getLegalCommands(s, 0);
    expect(legal).toContainEqual({ type: "attach", instanceId: "h1", unitId: "t" });
    expect(legal).not.toContainEqual({ type: "attach", instanceId: "h0", unitId: "t" });
    expect(legal).toContainEqual({ type: "play_action", instanceId: "h2" });
  });
});
