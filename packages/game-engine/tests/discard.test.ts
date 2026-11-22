import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  actingSeat,
  applyCommand,
  chooseBotCommand,
  CommandError,
  DISCARD_CARDS,
  getView,
  startGame,
  type Command,
  type GameState,
} from "../src/discard/index.ts";

const rng = () => createSeededRandom([3, 1, 4, 1]);
let uid = 0;
const card = (cardId: string) => ({ id: `t${String(uid++)}`, cardId });

/** 3 players, p0 to act, top card `top`; hands given as card ids. */
function table(top: string, hands: string[][]): GameState {
  const { state } = startGame(["p0", "p1", "p2"], rng());
  state.players.forEach((p, i) => (p.hand = (hands[i] ?? []).map(card)));
  state.pile = [card(top)];
  state.drawPile = Array.from({ length: 20 }, () => card("D01"));
  state.current = 0;
  state.open = false;
  return state;
}
const id = (s: GameState, seat: number, cardId: string) =>
  s.players[seat]?.hand.find((c) => c.cardId === cardId)?.id ?? "";
const run = (s: GameState, c: Command) => applyCommand(s, c, rng());
const err = (f: () => unknown) => {
  try {
    f();
  } catch (e) {
    if (e instanceof CommandError) return e.code;
    throw e;
  }
  return "none";
};
const play = (s: GameState, seat: number, cardId: string, useAbility = false, choice = {}) =>
  run(s, {
    type: "play",
    playerId: `p${String(seat)}`,
    card: id(s, seat, cardId),
    useAbility,
    choice,
  });

/** Draw; if the drawn card could be played (Draw Then Play), keep it — a plain "draw & pass". */
const drawPass = (s: GameState, seat: number) => {
  const t = run(s, { type: "draw", playerId: `p${String(seat)}` });
  return t.state.drawn ? run(t.state, { type: "keep", playerId: `p${String(seat)}` }) : t;
};

describe("discard edition — core rules", () => {
  it("deals 7 (2–4 players) / 5 (5–8), 64-card deck, starts on a normal card", () => {
    const four = startGame(["a", "b", "c", "d"], rng()).state;
    expect(four.players.every((p) => p.hand.length === 7)).toBe(true);
    const eight = startGame(["a", "b", "c", "d", "e", "f", "g", "h"], rng()).state;
    expect(eight.players.every((p) => p.hand.length === 5)).toBe(true);
    expect(eight.drawPile.length + eight.pile.length + 40).toBe(64);
    expect(DISCARD_CARDS).toHaveLength(16);
  });

  it("plays only cards with points ≥ the top; Eraser is wild", () => {
    const s = table("D09", [["D01", "D13", "D03"], ["D02"], ["D02"]]);
    expect(err(() => play(s, 0, "D01"))).toBe("cannot_play");
    expect(play(s, 0, "D13").state.current).toBe(1);
    expect(play(s, 0, "D03").state.pile.at(-1)?.cardId).toBe("D03");
  });

  it("pile resets after everyone else passes (DC1)", () => {
    let s = table("D01", [["D16", "D01"], ["D02"], ["D02"]]);
    s = play(s, 0, "D16").state; // 8 on top
    s = run(s, { type: "draw", playerId: "p1" }).state;
    const t = run(s, { type: "draw", playerId: "p2" });
    expect(t.events.some((e) => e.type === "pile_reset")).toBe(true);
    expect(t.state.current).toBe(0);
    expect(play(t.state, 0, "D01").state.players[0]?.hand).toHaveLength(0);
  });

  it("first empty hand wins", () => {
    const s = table("D01", [["D02"], ["D02"], ["D02"]]);
    const t = play(s, 0, "D02");
    expect(t.state.status).toBe("finished");
    expect(t.state.winner).toBe(0);
  });
});

describe("discard edition — abilities", () => {
  it("Rubber Band makes the next player draw; Umbrella can cancel it (DC3)", () => {
    const s = table("D01", [["D01", "D02"], ["D04"], ["D04"]]);
    const t = play(s, 0, "D01", true);
    expect(t.state.players[1]?.hand).toHaveLength(2);
    const u = table("D01", [["D01", "D02"], ["D16", "D04"], ["D04"]]);
    const w = play(u, 0, "D01", true);
    expect(actingSeat(w.state)).toBe(1);
    expect(getView(w.state, 1).canReact).toBe(true);
    const r = run(w.state, { type: "react", playerId: "p1", useUmbrella: true });
    expect(r.state.players[1]?.hand).toHaveLength(1);
    expect(r.state.pile.at(-1)?.cardId).toBe("D16");
  });

  it("Key skips; Fan reverses only; Alarm wakes the player with the fewest cards (ruleset 12)", () => {
    const s = table("D01", [["D13", "D02"], ["D04"], ["D04"]]);
    expect(play(s, 0, "D13", true).state.current).toBe(2);
    const f = play(table("D01", [["D14", "D02"], ["D04"], ["D04"]]), 0, "D14", true).state;
    expect(f.direction).toBe(-1);
    expect(f.current).toBe(2);
    expect(f.players[1]?.hand).toHaveLength(1);
    expect(f.players[2]?.hand).toHaveLength(1);
    const a = play(table("D01", [["D06", "D02"], ["D04", "D04"], ["D04"]]), 0, "D06", true).state;
    expect(a.direction).toBe(1);
    expect(a.players[2]?.hand).toHaveLength(2); // fewest cards → draws 1
  });

  it("Glue sticks a card on the chosen player; Ruler restricts; Eraser answers it", () => {
    const gt = table("D01", [["D02", "D01", "D13"], ["D02", "D05"], ["D04"]]);
    const g = play(gt, 0, "D02", true, { target: 2, card: id(gt, 0, "D01") }).state;
    expect(g.players[0]?.hand.map((c) => c.cardId)).toEqual(["D13"]);
    expect(g.players[2]?.hand.map((c) => c.cardId)).toEqual(["D04", "D01"]);
    expect(err(() => play(gt, 0, "D02", true, { target: 1 }))).toBe("invalid_choice");
    const r = play(table("D01", [["D09", "D01"], ["D13", "D03"], ["D04"]]), 0, "D09", true).state;
    expect(err(() => play(r, 1, "D13"))).toBe("cannot_play");
    expect(play(r, 1, "D03").state.current).toBe(2);
  });

  it("Tape sheds a pair; Scissors removes the card under and plays one more", () => {
    const s = table("D01", [["D10", "D02", "D02", "D01"], ["D04"], ["D04"]]);
    const hand = s.players[0]?.hand ?? [];
    const twos = hand.filter((c) => c.cardId === "D02").map((c) => c.id);
    const tape = run(s, {
      type: "play",
      playerId: "p0",
      card: id(s, 0, "D10"),
      useAbility: true,
      choice: { pair: [twos[0] ?? "", twos[1] ?? ""] },
    }).state;
    expect(tape.players[0]?.hand).toHaveLength(1);
    const sc = table("D02", [["D04", "D06", "D01"], ["D04"], ["D04"]]);
    const cut = play(sc, 0, "D04", true, { card: id(sc, 0, "D06") }).state;
    expect(cut.removed.map((c) => c.cardId)).toEqual(["D02"]);
    expect(cut.players[0]?.hand).toHaveLength(1);
  });

  it("Box, Magnet and Trash move cards; Magnifier reveals privately", () => {
    // Ruleset 10: Box puts one extra card of 1–3 points on the pile.
    const b = table("D02", [["D05", "D01", "D13"], ["D04", "D04"], ["D04"]]);
    const box = play(b, 0, "D05", true, { card: id(b, 0, "D01") }).state;
    expect(box.pile.at(-1)?.cardId).toBe("D01");
    expect(box.players[0]?.hand.map((c) => c.cardId)).toEqual(["D13"]);
    expect(err(() => play(b, 0, "D05", true, { card: id(b, 0, "D13") }))).toBe("invalid_choice");
    expect(play(b, 0, "D05", true, {}).state.players[0]?.hand).toHaveLength(2);
    const m = table("D01", [["D07", "D01", "D13"], ["D04", "D04"], ["D04"]]);
    const mag = play(m, 0, "D07", true, { card: id(m, 0, "D01") }).state;
    expect(mag.players[2]?.hand).toHaveLength(2);
    const tr = table("D11", [["D11", "D02", "D04"], ["D04"], ["D04"]]);
    const trashed = play(tr, 0, "D11", true, { card: id(tr, 0, "D02") }).state;
    expect(trashed.players[0]?.hand).toHaveLength(1); // ruleset 9: no redraw
    expect(trashed.drawPile).toHaveLength(tr.drawPile.length);
    const last = table("D11", [["D11", "D02"], ["D04"], ["D04"]]);
    expect(play(last, 0, "D11", true, { card: id(last, 0, "D02") }).state.winner).toBe(0);
    // Ruleset 12: Magnifier sees the top 2 cards of the draw pile (target null).
    const pkT = table("D01", [["D08", "D01"], ["D04", "D13"], ["D04"]]);
    pkT.drawPile = [card("D16"), card("D10"), ...pkT.drawPile];
    const pk = play(pkT, 0, "D08", true);
    const peek = pk.events.find((e) => e.type === "peek");
    expect(peek?.type === "peek" && peek.target === null && peek.cards).toEqual(["D16", "D10"]);
    // Ruleset 12: Flashlight shows one opponent's whole hand privately; no draw.
    const fl = table("D01", [["D12", "D02"], ["D04", "D13"], ["D04"]]);
    const lit = play(fl, 0, "D12", true, { target: 1 });
    const seen = lit.events.find((e) => e.type === "peek");
    expect(seen?.type === "peek" && seen.target === 1 && seen.cards).toEqual(["D04", "D13"]);
    expect(lit.state.players[1]?.hand).toHaveLength(2);
  });

  it("Hourglass repeats the ability of the card under it", () => {
    let s = table("D01", [
      ["D01", "D15", "D02"],
      ["D04", "D04"],
      ["D04", "D04"],
    ]);
    s = play(s, 0, "D01").state;
    s = drawPass(s, 1).state;
    s = drawPass(s, 2).state; // reset → p0 again
    const t = play(s, 0, "D15", true);
    expect(t.events.flatMap((e) => (e.type === "ability" ? [e.ability] : []))).toContain(
      "next_draw",
    );
  });
});

describe("discard edition — Draw Then Play (ruleset 8)", () => {
  it("a legal drawn card may be played — only that card", () => {
    const s = table("D01", [["D13"], ["D04"], ["D04"]]);
    s.drawPile = [card("D05"), ...s.drawPile];
    const d = run(s, { type: "draw", playerId: "p0" }).state;
    expect(d.drawn?.seat).toBe(0);
    expect(d.current).toBe(0);
    expect(getView(d, 0).playable).toEqual([d.drawn?.id]);
    expect(err(() => play(d, 0, "D13"))).toBe("cannot_play");
    expect(err(() => run(d, { type: "draw", playerId: "p0" }))).toBe("cannot_play");
    const p = play(d, 0, "D05");
    expect(p.state.pile.at(-1)?.cardId).toBe("D05");
    expect(p.state.current).toBe(1);
    expect(p.state.drawn).toBeNull();
  });

  it("keep ends the turn as a pass; an illegal drawn card passes at once", () => {
    const s = table("D09", [["D01"], ["D13"], ["D04"]]);
    s.drawPile = [card("D13"), card("D02"), ...s.drawPile];
    const d = run(s, { type: "draw", playerId: "p0" }).state;
    const k = run(d, { type: "keep", playerId: "p0" }).state;
    expect(k.current).toBe(1);
    expect(k.passStreak).toBe(1);
    expect(k.players[0]?.hand).toHaveLength(2);
    const illegal = run(k, { type: "draw", playerId: "p1" });
    expect(illegal.state.drawn).toBeNull();
    expect(illegal.state.current).toBe(2);
    expect(illegal.events.some((e) => e.type === "passed")).toBe(true);
    expect(err(() => run(illegal.state, { type: "keep", playerId: "p2" }))).toBe("cannot_play");
  });

  it("Ruler and Glue apply to the drawn card", () => {
    const r = play(table("D01", [["D09", "D01"], ["D13"], ["D04"]]), 0, "D09", true).state;
    r.drawPile = [card("D13"), ...r.drawPile];
    const forced = run(r, { type: "draw", playerId: "p1" });
    expect(forced.state.drawn).toBeNull();
    expect(forced.events).toContainEqual({ type: "passed", seat: 1, forced: true });
  });
});

describe("discard edition — simulation", () => {
  it("bot games always finish for 2–8 players and keep 64 cards", () => {
    for (const n of [2, 3, 4, 5, 6, 7, 8])
      for (let g = 1; g <= 40; g++) {
        const r = createSeededRandom([g, n, 5, 9]);
        let { state: s } = startGame(
          Array.from({ length: n }, (_, i) => `p${String(i)}`),
          r,
        );
        for (let k = 0; s.status === "active"; k++) {
          if (k > 3000) throw new Error("did not finish");
          const seat = actingSeat(s) ?? 0;
          s = applyCommand(s, chooseBotCommand(s, seat, r), r).state;
          const total =
            s.players.reduce((a, p) => a + p.hand.length, 0) +
            s.drawPile.length +
            s.pile.length +
            s.removed.length;
          expect(total).toBe(64);
        }
        expect(s.winner).not.toBeNull();
      }
  });

  it("views never contain other players' hands", () => {
    const { state } = startGame(["a", "b", "c"], rng());
    const json = JSON.stringify(getView(state, 0));
    for (const c of state.players[1]?.hand ?? []) expect(json).not.toContain(`"${c.id}"`);
  });
});
