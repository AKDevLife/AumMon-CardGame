import { describe, expect, it } from "vitest";
import { compareTurnOrder, getPlayer } from "../src/domain/state.ts";
import type { CardEffect, GameState, PlayerState } from "../src/domain/types.ts";
import { countCards } from "../src/rules/v1/deck.ts";
import { decideResult, resolveRound } from "../src/rules/v1/resolve.ts";
import {
  aquaEligible,
  forfeit,
  pendingPlayers,
  startRound,
  submitAction,
  useTurnStartSkill,
} from "../src/rules/v1/round.ts";
import { initializeMatch } from "../src/rules/v1/setup.ts";
import { matchInput } from "./fixtures.ts";
import { command, rng, selectState } from "./scenario.ts";

type Play = [
  player: string,
  effect: CardEffect,
  extra?: { targetPlayerId?: string; choice?: string },
];

function play(state: GameState, plays: Play[], seed = 7) {
  let s = state;
  for (const [player, effect, extra] of plays) {
    const out = submitAction(s, player, command(s, player, effect, extra));
    if (!out.transition) throw new Error(JSON.stringify(out.result));
    s = out.transition.state;
  }
  return resolveRound(s, rng(seed));
}

const hp = (s: GameState, id: string) => getPlayer(s, id).hp;
const types = (events: { type: string }[]) => events.map((e) => e.type);

describe("Rule 1/12 — turn order", () => {
  it("speed high→low, ties by lower seat", () => {
    const p = (seat: number, speed: number) => ({ seat, speed }) as PlayerState;
    expect([p(2, 50), p(1, 50), p(3, 90)].sort(compareTurnOrder).map((x) => x.seat)).toEqual([
      3, 1, 2,
    ]);
  });
});

describe("Rule 3 — fizzle when target already eliminated", () => {
  it("slower attack on an eliminated target fizzles; no retarget", () => {
    // breeze(90) and pyro(70) both attack aqua(60, 1hp)
    const s = selectState(
      ["breeze_kit", "pyro_pup", "aqua_otter"],
      [["attack"], ["attack"], ["defense"]],
      { 2: { hp: 1 } },
    );
    const { state, events } = play(s, [
      ["p1", "attack", { targetPlayerId: "p3" }],
      ["p2", "attack", { targetPlayerId: "p3" }],
      ["p3", "defense"],
    ]);
    // shield absorbs breeze's hit; pyro's hit lands (1 + bonus) and eliminates aqua
    expect(getPlayer(state, "p3").status).toBe("eliminated");
    const s2 = selectState(
      ["breeze_kit", "pyro_pup", "aqua_otter"],
      [["attack"], ["attack"], ["support"]],
      { 2: { hp: 1 } },
    );
    const r2 = play(s2, [
      ["p1", "attack", { targetPlayerId: "p3" }],
      ["p2", "attack", { targetPlayerId: "p3" }],
      ["p3", "support", { choice: "heal" }],
    ]);
    expect(types(r2.events)).toContain("action.fizzled");
    expect(types(r2.events)).toContain("action.cancelled"); // Rule 13: aqua's heal cancelled
    expect(hp(r2.state, "p1")).toBe(3);
    expect(events.length).toBeGreaterThan(0);
  });
});

describe("Rule 4 — Defense is a 1-damage shield for the whole round", () => {
  it("absorbs the first point even when the defender is slower", () => {
    // pyro(70) defends; breeze(90) and aqua(60) attack pyro
    const s = selectState(
      ["pyro_pup", "breeze_kit", "aqua_otter"],
      [["defense"], ["attack"], ["attack"]],
    );
    const { state, events } = play(s, [
      ["p1", "defense"],
      ["p2", "attack", { targetPlayerId: "p1" }],
      ["p3", "attack", { targetPlayerId: "p1" }],
    ]);
    expect(hp(state, "p1")).toBe(2);
    const hits = events.filter((e) => e.type === "hit").map((e) => e.publicPayload);
    expect(hits.map((h) => [h["absorbed"], h["damage"]])).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });
});

describe("Rule 5 / Q2 — Redirect", () => {
  it("sends single-target actions aimed at the redirector to the chosen player", () => {
    // pyro attacks aqua; aqua redirects to breeze (breeze has no cards → cannot dodge)
    const s = selectState(
      ["pyro_pup", "aqua_otter", "breeze_kit"],
      [["attack"], ["redirect"], ["defense"]],
    );
    const { state, events } = play(s, [
      ["p1", "attack", { targetPlayerId: "p2" }],
      ["p2", "redirect", { targetPlayerId: "p3" }],
      ["p3", "defense"],
    ]);
    expect(types(events)).toContain("action.redirected");
    expect(hp(state, "p2")).toBe(3);
    expect(hp(state, "p3")).toBe(3); // breeze's own shield absorbed it
  });

  it("can reflect an attack back to the attacker", () => {
    const s = selectState(["breeze_kit", "pyro_pup"], [["attack"], ["redirect"]]);
    const { state } = play(s, [
      ["p1", "attack", { targetPlayerId: "p2" }],
      ["p2", "redirect", { targetPlayerId: "p1" }],
    ]);
    expect(hp(state, "p1")).toBe(2); // breeze has no hand card left to dodge
    expect(hp(state, "p2")).toBe(3);
  });
});

describe("Rule 5 / Q5 — AoE and Disrupt", () => {
  it("AoE hits every other living player once each, through hooks", () => {
    // aqua AoE; terra reduces to 0, breeze dodges by discarding, pyro takes 1 (no bonus for AoE)
    const s = selectState(
      ["aqua_otter", "terra_tortoise", "breeze_kit", "pyro_pup"],
      [["aoe"], ["defense"], ["defense", "attack"], ["defense"]],
    );
    const { state, events } = play(s, [
      ["p1", "aoe"],
      ["p2", "defense"],
      ["p3", "defense"],
      ["p4", "defense"],
    ]);
    expect([hp(state, "p2"), hp(state, "p3"), hp(state, "p4")]).toEqual([4, 3, 3]);
    expect(types(events)).toContain("hit.dodged");
    expect(state.hands["p3"]).toHaveLength(0);
  });

  it("Disrupt discards a random card and is not a Hit", () => {
    const s = selectState(
      ["pyro_pup", "breeze_kit"],
      [["disrupt"], ["defense", "attack", "support"]],
    );
    const { state, events } = play(s, [
      ["p1", "disrupt", { targetPlayerId: "p2" }],
      ["p2", "defense"],
    ]);
    expect(state.hands["p2"]).toHaveLength(1);
    expect(types(events)).not.toContain("hit.dodged");
  });
});

describe("Rule 6 — Support", () => {
  it("heal is capped at maxHp; draw adds a card", () => {
    const s = selectState(["pyro_pup", "aqua_otter"], [["support"], ["support"]], { 0: { hp: 2 } });
    const { state } = play(s, [
      ["p1", "support", { choice: "heal" }],
      ["p2", "support", { choice: "draw" }],
    ]);
    expect(hp(state, "p1")).toBe(3);
    expect(state.hands["p2"]).toHaveLength(1);
  });
});

describe("Rule 9 — Breeze dodges each hit while it has cards", () => {
  it("auto-discards one card per hit until the hand is empty", () => {
    const s = selectState(
      ["breeze_kit", "pyro_pup", "aqua_otter"],
      [["defense", "support"], ["attack"], ["attack"]],
    );
    const { state } = play(s, [
      ["p1", "defense"],
      ["p2", "attack", { targetPlayerId: "p1" }],
      ["p3", "attack", { targetPlayerId: "p1" }],
    ]);
    expect(state.hands["p1"]).toHaveLength(0); // dodged pyro with its last card
    expect(hp(state, "p1")).toBe(3); // aqua's hit absorbed by shield
  });
});

describe("Rule 10 / Q4 — Pyro bonus only when damage lands", () => {
  it("+1 on an unblocked hit", () => {
    const s = selectState(["pyro_pup", "aqua_otter"], [["attack"], ["support"]]);
    const { state } = play(s, [
      ["p1", "attack", { targetPlayerId: "p2" }],
      ["p2", "support", { choice: "draw" }],
    ]);
    expect(hp(state, "p2")).toBe(1);
    expect(getPlayer(state, "p1").skillState["pyroBonusUsed"]).toBe(true);
  });

  it("no bonus vs Terra (reduced to 0) — bonus stays unused", () => {
    const s = selectState(["pyro_pup", "terra_tortoise"], [["attack"], ["support"]]);
    const { state } = play(s, [
      ["p1", "attack", { targetPlayerId: "p2" }],
      ["p2", "support", { choice: "draw" }],
    ]);
    expect(hp(state, "p2")).toBe(4);
    expect(getPlayer(state, "p1").skillState["pyroBonusUsed"]).not.toBe(true);
  });
});

describe("Rule 11 / Q7 — Aqua swap window", () => {
  it("opens turn_start and swaps one random card each way, once per match", () => {
    let state = initializeMatch(matchInput(["aqua_otter", "pyro_pup"]), rng()).state;
    state = startRound(state, rng()).state;
    expect(state.phase).toBe("turn_start");
    const before = { aqua: [...(state.hands["p1"] ?? [])], pyro: [...(state.hands["p2"] ?? [])] };
    const t = useTurnStartSkill(state, "p1", { kind: "swap", targetPlayerId: "p2" }, rng());
    const after = { aqua: t.state.hands["p1"] ?? [], pyro: t.state.hands["p2"] ?? [] };
    expect(after.aqua.filter((c) => !before.aqua.includes(c))).toHaveLength(1);
    expect(after.pyro.filter((c) => !before.pyro.includes(c))).toHaveLength(1);
    expect(t.state.phase).toBe("select");
    expect(aquaEligible(t.state)).toBeNull();
    expect(JSON.stringify(t.events)).not.toContain(after.aqua[0] ?? "zz"); // cards not revealed
  });

  it("skip keeps the skill for a later round", () => {
    let state = initializeMatch(matchInput(["aqua_otter", "pyro_pup"]), rng()).state;
    state = startRound(state, rng()).state;
    const t = useTurnStartSkill(state, "p1", { kind: "skip" }, rng());
    expect(t.state.phase).toBe("select");
    expect(getPlayer(t.state, "p1").skillState["swapUsed"]).toBeUndefined();
    expect(() => useTurnStartSkill(t.state, "p1", { kind: "skip" }, rng())).toThrow();
  });

  it("no window without an eligible Aqua", () => {
    let state = initializeMatch(matchInput(["pyro_pup", "breeze_kit"]), rng()).state;
    state = startRound(state, rng()).state;
    expect(state.phase).toBe("select");
    expect(state.round).toBe(1);
    expect(Object.values(state.hands).map((h) => h.length)).toEqual([4, 4]);
  });
});

describe("Rule 13 — elimination cancels pending actions", () => {
  it("a slower eliminated player does not act", () => {
    const s = selectState(["breeze_kit", "aqua_otter"], [["attack"], ["attack"]], { 1: { hp: 1 } });
    const { state, events } = play(s, [
      ["p1", "attack", { targetPlayerId: "p2" }],
      ["p2", "attack", { targetPlayerId: "p1" }],
    ]);
    expect(types(events)).toContain("action.cancelled");
    expect(hp(state, "p1")).toBe(3);
    expect(state.result).toEqual({ status: "win", winnerId: "p1" });
    expect(state.phase).toBe("end");
    expect(state.hands["p2"]).toEqual([]);
    expect(countCards(state)).toBe(40);
  });
});

describe("Rule 15 — no survivors is a draw", () => {
  it("decideResult", () => {
    const s = selectState(["pyro_pup", "aqua_otter"], [[], []]);
    for (const p of s.players) p.status = "eliminated";
    decideResult(s);
    expect(s.result).toEqual({ status: "draw" });
  });
});

describe("round lifecycle", () => {
  it("requires all living players before resolving; submit does not bump version", () => {
    const s = selectState(["pyro_pup", "aqua_otter"], [["attack"], ["defense"]]);
    const out = submitAction(s, "p1", command(s, "p1", "attack", { targetPlayerId: "p2" }));
    expect(out.transition?.state.version).toBe(s.version);
    expect(pendingPlayers(out.transition?.state ?? s)).toEqual(["p2"]);
    expect(() => resolveRound(out.transition?.state ?? s, rng())).toThrow(/Not all/);
  });

  it("does not mutate the input state", () => {
    const s = selectState(["pyro_pup", "aqua_otter"], [["attack"], ["defense"]]);
    const snapshot = JSON.stringify(s);
    play(s, [
      ["p1", "attack", { targetPlayerId: "p2" }],
      ["p2", "defense"],
    ]);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

describe("forfeit (matches-forfeit)", () => {
  it("surrenders, discards the hand and can end the match", () => {
    const s = selectState(["pyro_pup", "aqua_otter"], [["attack"], ["defense"]]);
    const t = forfeit(s, "p2");
    expect(getPlayer(t.state, "p2").status).toBe("surrendered");
    expect(t.state.hands["p2"]).toEqual([]);
    expect(t.state.result).toEqual({ status: "win", winnerId: "p1" });
    expect(t.state.phase).toBe("end");
    expect(countCards(t.state)).toBe(40);
    expect(() => forfeit(t.state, "p1")).toThrow();
  });

  it("with 3 players the match continues and the leaver no longer blocks resolve", () => {
    const s = selectState(
      ["pyro_pup", "aqua_otter", "breeze_kit"],
      [["attack"], ["defense"], ["defense"]],
    );
    const t = forfeit(s, "p3");
    expect(t.state.result.status).toBe("ongoing");
    expect(pendingPlayers(t.state)).toEqual(["p1", "p2"]);
  });
});
