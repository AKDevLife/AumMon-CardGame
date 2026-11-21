import { describe, expect, it } from "vitest";
import { unitAtk, unitHp, unitKeywords, type MatchState } from "../src/rules/v5/index.ts";
import { at, board, errorOf, giveCard, obj, play } from "./v5-fixtures.ts";

const u = (s: MatchState, seat: 0 | 1, id: string) => {
  const x = s.players[seat].units.find((v) => v.instanceId === id);
  if (!x) throw new Error(`no unit ${id}`);
  return x;
};

describe("ruleset 3 — Active abilities (framework §3.1)", () => {
  it("is free (no SPARK), does not put the source to sleep, applies the effect", () => {
    const s = board([obj("a", "O05")], [obj("x", "O09")]);
    s.players[0].spark = 0;
    const t = play(s, { type: "activate", instanceId: "a", target: "x" });
    expect(t.state.players[0].spark).toBe(0);
    expect(u(t.state, 0, "a").exhausted).toBe(false);
    expect(u(t.state, 1, "x").damage).toBe(2);
    expect(t.events.some((e) => e.type === "ability_activated")).toBe(true);
  });

  it("a sleeping Object can use its Active; it may attack and then activate", () => {
    const s = board([obj("a", "O05", true)], [obj("x", "O12")]);
    const t = play(s, { type: "activate", instanceId: "a", target: "x" });
    expect(u(t.state, 1, "x").damage).toBe(2);
    const b = board([obj("a", "O05")], [obj("x", "O08")]);
    const hit = play(b, { type: "attack", attackerId: "a", target: "x" });
    const after = play(hit.state, { type: "activate", instanceId: "a", target: "x" });
    expect(after.state.players[1].units).toHaveLength(0);
  });

  it("any action order: summon after attacking", () => {
    const s = board([obj("a", "O05")], []);
    const t = play(s, { type: "attack", attackerId: "a", target: "player" });
    const id = giveCard(t.state, "O01");
    expect(play(t.state, { type: "summon", instanceId: id }).state.players[0].units).toHaveLength(
      2,
    );
  });

  it("Guard (awake or asleep) must be attacked first", () => {
    const s = board([obj("a", "O05")], [obj("g", "O09", true), obj("x", "O01")]);
    expect(errorOf(() => play(s, { type: "attack", attackerId: "a", target: "player" }))).toBe(
      "guard_blocks",
    );
    expect(errorOf(() => play(s, { type: "attack", attackerId: "a", target: "x" }))).toBe(
      "guard_blocks",
    );
    expect(play(s, { type: "attack", attackerId: "a", target: "g" }).events.length).toBeGreaterThan(
      0,
    );
  });

  it("Guard and Flying never combine: Helmet cannot target a flying ally", () => {
    const s = board([obj("h", "O11"), obj("r", "O06")], []);
    expect(errorOf(() => play(s, { type: "activate", instanceId: "h", target: "r" }))).toBe(
      "invalid_target",
    );
  });

  it("Turbo: stays Ready to attack, once per turn, then sleeps at end of turn", () => {
    const s = board([obj("car", "O02")], []);
    const t = play(s, { type: "activate", instanceId: "car" });
    expect(u(t.state, 0, "car").exhausted).toBe(false);
    expect(unitAtk(t.state.players[0].units, u(t.state, 0, "car"))).toBe(4);
    expect(errorOf(() => play(t.state, { type: "activate", instanceId: "car" }))).toBe(
      "active_used",
    );
    const after = play(t.state, { type: "end_turn" });
    expect(u(after.state, 0, "car").exhausted).toBe(true);
    const back = play(after.state, { type: "end_turn" }, "foe");
    expect(u(back.state, 0, "car").exhausted).toBe(false);
  });

  it("validates the target before paying", () => {
    const s = board([obj("a", "O05")], []);
    expect(errorOf(() => play(s, { type: "activate", instanceId: "a", target: "ghost" }))).toBe(
      "invalid_target",
    );
    expect(s.players[0].units[0]?.exhausted).toBe(false);
    const clock = board([obj("c", "O13")], [obj("x", "O09", true)]);
    expect(errorOf(() => play(clock, { type: "activate", instanceId: "c", target: "x" }))).toBe(
      "invalid_target",
    );
  });

  it("own turn only, and only for Objects with an Active", () => {
    const s = board([obj("a", "O05"), obj("p", "O01")], []);
    expect(errorOf(() => play(s, { type: "activate", instanceId: "p" }))).toBe("no_active");
    expect(errorOf(() => play(s, { type: "activate", instanceId: "a" }, "foe"))).toBe(
      "not_your_turn",
    );
  });

  it("Active damage kills at HP 0 and fires on_destroyed", () => {
    const s = board([obj("e", "O14")], [obj("box", "O08")]);
    at(s.players[1].units, 0).damage = 2;
    const hand = s.players[1].hand.length;
    const t = play(s, { type: "activate", instanceId: "e", target: "box" });
    expect(t.state.players[1].units).toHaveLength(0);
    expect(t.state.players[1].hand.length).toBe(hand + 1);
    expect(t.events.map((e) => e.type)).toContain("ability_triggered");
  });

  it("heals a unit but never above max HP; heals the player up to 20", () => {
    const s = board([obj("c", "O10"), obj("d", "O09")], []);
    at(s.players[0].units, 1).damage = 1;
    const t = play(s, { type: "activate", instanceId: "c", target: "d" });
    expect(u(t.state, 0, "d").damage).toBe(0);
    s.players[0].hp = 19;
    const t2 = play(s, { type: "activate", instanceId: "c", target: "player" });
    expect(t2.state.players[0].hp).toBe(20);
  });

  it("Helmet grants Guard until our next turn, then it expires", () => {
    const s = board([obj("h", "O11"), obj("r", "O01")], [obj("x", "O09")]);
    let t = play(s, { type: "activate", instanceId: "h", target: "r" });
    expect(unitKeywords(u(t.state, 0, "r")).has("guard")).toBe(true);
    t = play(t.state, { type: "end_turn" });
    expect(unitKeywords(u(t.state, 0, "r")).has("guard")).toBe(true);
    expect(
      errorOf(() => play(t.state, { type: "attack", attackerId: "x", target: "player" }, "foe")),
    ).toBe("guard_blocks");
    t = play(t.state, { type: "end_turn" }, "foe");
    expect(unitKeywords(u(t.state, 0, "r")).has("guard")).toBe(false);
  });

  it("Glue −2 ATK lasts through the opponent's turn", () => {
    const s = board([obj("g", "O16")], [obj("x", "O05")]);
    let t = play(s, { type: "activate", instanceId: "g", target: "x" });
    t = play(t.state, { type: "end_turn" });
    expect(unitAtk(t.state.players[1].units, u(t.state, 1, "x"))).toBe(1);
    t = play(t.state, { type: "end_turn" }, "foe");
    expect(unitAtk(t.state.players[1].units, u(t.state, 1, "x"))).toBe(3);
  });

  it("Power Strip gives another ELECTRONIC +2 ATK; Alarm Clock wakes a sleeping ally", () => {
    const s = board([obj("ps", "O20"), obj("c", "O13", true), obj("p", "O01", true)], []);
    expect(errorOf(() => play(s, { type: "activate", instanceId: "ps", target: "p" }))).toBe(
      "invalid_target",
    );
    const t = play(s, { type: "activate", instanceId: "ps", target: "c" });
    expect(unitAtk(t.state.players[0].units, u(t.state, 0, "c"))).toBe(3);
    const w = play(t.state, { type: "activate", instanceId: "c", target: "p" });
    expect(u(w.state, 0, "p").exhausted).toBe(false);
  });

  it("Rubber Band can hit the enemy player", () => {
    const s = board([obj("b", "O03")], []);
    const t = play(s, { type: "activate", instanceId: "b", target: "player" });
    expect(t.state.players[1].hp).toBe(19);
  });

  it("Wrench +2 HP is permanent", () => {
    const s = board([obj("w", "O21"), obj("p", "O01")], []);
    const t = play(s, { type: "activate", instanceId: "w", target: "p" });
    expect(unitHp(t.state.players[0].units, u(t.state, 0, "p"))).toBe(4);
  });
});

describe("ruleset 3 — Passive abilities (framework §3.2)", () => {
  it("on_summon: Alarm Clock draws, Flashlight hits every enemy", () => {
    const s = board([], [obj("x", "O01"), obj("y", "O09")]);
    const hand = s.players[0].hand.length;
    const clock = giveCard(s, "O13");
    let t = play(s, { type: "summon", instanceId: clock });
    expect(t.state.players[0].hand.length).toBe(hand + 1); // +1 given, −1 summoned, +1 drawn
    const light = giveCard(t.state, "O15");
    t = play(t.state, { type: "summon", instanceId: light });
    expect(t.state.players[1].units.map((x) => x.damage)).toEqual([1, 1]);
  });

  it("on_attack resolves before damage (Toy Racer +1 ATK)", () => {
    const s = board([obj("car", "O02")], []);
    const t = play(s, { type: "attack", attackerId: "car", target: "player" });
    expect(t.state.players[1].hp).toBe(17);
  });

  it("on_destroyed resolves after the source left (Pencil)", () => {
    const s = board([obj("a", "O05")], [obj("p", "O01")]);
    const t = play(s, { type: "attack", attackerId: "a", target: "p" });
    expect(t.state.players[1].units).toHaveLength(0);
    expect(t.state.players[0].hp).toBe(19);
  });

  it("static aura: Pencil Case +1 ATK to other STATIONERY; Backpack +1 HP to others", () => {
    const s = board([obj("pc", "O19"), obj("p", "O01"), obj("bp", "O07")], []);
    const side = s.players[0].units;
    expect(unitAtk(side, at(side, 1))).toBe(3);
    expect(unitAtk(side, at(side, 0))).toBe(1);
    expect(unitHp(side, at(side, 1))).toBe(3);
    expect(unitHp(side, at(side, 2))).toBe(5);
  });

  it("static aura stops when the source leaves; lost HP can destroy", () => {
    const s = board([obj("x", "O14")], [obj("bp", "O07"), obj("p", "O01")]);
    at(s.players[1].units, 0).damage = 2;
    at(s.players[1].units, 1).damage = 2; // alive only thanks to Backpack (+1 HP)
    const t = play(s, { type: "activate", instanceId: "x", target: "bp" });
    expect(t.state.players[1].units).toHaveLength(0);
  });

  it("Hammer scales with other TOOLs; Bicycle needs another VEHICLE", () => {
    const s = board([obj("h", "O22"), obj("w", "O21"), obj("sd", "O23")], []);
    expect(unitAtk(s.players[0].units, at(s.players[0].units, 0))).toBe(5);
    const b = board([obj("bike", "O04")], []);
    expect(unitAtk(b.players[0].units, at(b.players[0].units, 0))).toBe(3);
    b.players[0].units.push(obj("car", "O02"));
    expect(unitAtk(b.players[0].units, at(b.players[0].units, 0))).toBe(4);
  });

  it("on_turn_start: Umbrella heals, Radio draws", () => {
    const s = board([], [obj("u", "O09"), obj("r", "O18")]);
    at(s.players[1].units, 0).damage = 3;
    const hand = s.players[1].hand.length;
    const t = play(s, { type: "end_turn" });
    expect(at(t.state.players[1].units, 0).damage).toBe(1);
    expect(t.state.players[1].hand.length).toBe(hand + 2);
  });

  it("search finds a card with the trait and reveals it", () => {
    const s = board([], []);
    const w = giveCard(s, "O21");
    const t = play(s, { type: "summon", instanceId: w });
    const found = t.events.find((e) => e.type === "card_searched");
    expect(found).toBeDefined();
  });

  it("several triggers at once resolve active player first, by slot", () => {
    const s = board([obj("x", "O14")], []);
    s.players[0].units = [obj("p1", "O01"), obj("p2", "O01")];
    s.players[1].units = [obj("f", "O15")];
    s.players[0].units.forEach((x) => (x.damage = 1));
    s.activeSeat = 1;
    const fl = "fl";
    s.players[1].hand.push({ instanceId: fl, cardId: "O15" });
    s.players[1].spark = 8;
    const t = play(s, { type: "summon", instanceId: fl }, "foe");
    const order = t.events.flatMap((e) => (e.type === "ability_triggered" ? [e.instanceId] : []));
    expect(order).toEqual(["fl", "p1", "p2"]);
    expect(t.state.players[1].hp).toBe(18);
  });

  it("duplicate requests are rejected by state (once per turn)", () => {
    const s = board([obj("a", "O05")], [obj("x", "O12")]);
    const t = play(s, { type: "activate", instanceId: "a", target: "x" });
    expect(errorOf(() => play(t.state, { type: "activate", instanceId: "a", target: "x" }))).toBe(
      "active_used",
    );
  });
});
