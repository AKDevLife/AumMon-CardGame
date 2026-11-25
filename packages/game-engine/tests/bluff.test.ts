import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import { bluff, parseBluffCommand, type BluffSetup } from "../src/bluff/module.ts";
import { placements, scoreRound, type SeatInput } from "../src/bluff/scoring.ts";
import { advance, GameRuleError, InvalidCommandError, type Kind } from "../src/sdk/index.ts";

const rng = () => createSeededRandom([9, 8, 7, 6]);
const setup = (slow = false): BluffSetup => ({
  slow,
  items: Array.from({ length: 5 }, (_, i) => ({
    id: `item-${String(i)}`,
    version: 1,
    prompt: `คำถาม ${String(i)}`,
    options: ["ก", "ข", "ค", "ง"],
  })),
});
const seat = (
  answer: SeatInput["answer"],
  prediction: SeatInput["prediction"],
  wager: SeatInput["wager"] = 0,
  claim: SeatInput["claim"] = null,
): SeatInput => ({ answer, prediction, wager, claim });

describe("BLUFF scoring (ruleset 2)", () => {
  it("3–4 players: prediction, wager, crowd, bluff cap 1, honest", () => {
    // votes: A=2 (seats 0,1), B=1 (seat 2), C=1 (seat 3)
    const r = scoreRound(
      [
        seat(0, 0, 2, 1), // answers A, predicts A (wager 2), bluffs B
        seat(0, 1, 1), // predicts B; its Top (A,B,C tie) contains B → not fooled
        seat(1, 0, 0, 1), // honest claim B
        seat(2, 1, 0),
      ],
      1,
    );
    expect(r.map((x) => x.top.length)).toEqual([3, 3, 1, 1]);
    expect(r[0]).toMatchObject({ prediction: 4, crowd: 1, bluff: 1, base: 6 }); // seat 3 believed B and was wrong
    expect(r[2]).toMatchObject({ honest: 1 });
    expect(r[3]).toMatchObject({ prediction: 0, crowd: 0, hit: false });
  });

  it("bluff counts only opponents who predicted the claim and were wrong; cap by size", () => {
    const four = scoreRound([seat(0, 0, 0, 3), seat(1, 3), seat(1, 3), seat(1, 1)], 1);
    expect(four[0]?.bluff).toBe(1);
    const six = scoreRound(
      [seat(0, 0, 0, 3), seat(1, 3), seat(1, 3), seat(1, 3), seat(1, 1), seat(2, 1)],
      1,
    );
    expect(six[0]?.bluff).toBe(2);
  });

  it("2 players: Top = opponent's answer; no Crowd, no Bluff, no Honest points", () => {
    const r = scoreRound([seat(0, 1, 2, 2), seat(1, 2, 1, 1)], 1);
    expect(r[0]).toMatchObject({ prediction: 4, crowd: 0, bluff: 0, honest: 0, base: 4 });
    expect(r[1]).toMatchObject({ prediction: -1, bluff: 0, honest: 0 });
  });

  it("timeout seat: not counted in votes, no points; final round doubles", () => {
    const r = scoreRound([seat(null, null), seat(1, 2, 1), seat(2, 1, 1)], 2);
    expect(r[0]?.total).toBe(0);
    expect(r[1]).toMatchObject({ base: 4, total: 8 });
  });

  it("placements: score → correct predictions → bluff+honest, else shared", () => {
    expect(placements([10, 10, 10, 4], [3, 3, 2, 9], [1, 1, 5, 0])).toEqual([1, 1, 3, 4]);
    expect(placements([5, 5], [2, 2], [0, 1])).toEqual([2, 1]);
  });
});

describe("BLUFF module", () => {
  it("rejects bad setup and bad client commands", () => {
    expect(() => bluff.start(["a", "b"], rng(), {})).toThrow(InvalidCommandError);
    expect(() => parseBluffCommand({ type: "lock", answer: 4, prediction: 0, wager: 0 })).toThrow();
    expect(() => parseBluffCommand({ type: "lock_default" })).toThrow();
    expect(() => parseBluffCommand({ type: "taunt", taunt: 99 })).toThrow();
  });

  it("hides answers before Reveal and shows them after", () => {
    let s = bluff.start(["a", "b", "c"], rng(), setup()).state;
    s = bluff.tick?.(s, rng()).state ?? s; // read → claim
    for (const i of [0, 1, 2]) s = bluff.apply(s, i, { type: "pass" }, rng()).state;
    expect(s.phase).toBe("lock");
    s = bluff.apply(s, 0, { type: "lock", answer: 2, prediction: 1, wager: 1 }, rng()).state;
    const other = bluff.view(s, 1);
    expect(other.locked).toEqual([true, false, false]);
    expect(other.myLock).toBeNull();
    expect(other.reveal).toBeNull();
    expect(JSON.stringify(other)).not.toContain('"answer":2');
    expect(bluff.view(s, 0).myLock).toMatchObject({ answer: 2 });
    expect(() =>
      bluff.apply(s, 0, { type: "lock", answer: 1, prediction: 1, wager: 0 }, rng()),
    ).toThrow(GameRuleError);
    for (const i of [1, 2])
      s = bluff.apply(s, i, { type: "lock", answer: 2, prediction: 2, wager: 0 }, rng()).state;
    expect(s.phase).toBe("reveal");
    expect(bluff.view(s, 1).reveal?.locks[0]).toMatchObject({ answer: 2, prediction: 1 });
  });

  it("plays 5 rounds through the SDK flow on timeouts only (slow timers ×1.5)", () => {
    const kinds: Kind[] = ["human", "human", "human", "human"];
    let rt = {
      state: bluff.start(["a", "b", "c", "d"], rng(), setup(true)).state,
      rng: rng().getState(),
      deadline: null as number | null,
      timeouts: [0, 0, 0, 0],
    };
    let now = 0;
    rt = advance(bluff, rt, kinds, now, "online");
    expect(rt.deadline).toBe(9_000);
    for (let i = 0; i < 40 && !bluff.isFinished(rt.state); i++) {
      now = rt.deadline ?? now;
      rt = advance(bluff, rt, kinds, now, "online");
    }
    expect(rt.state.history).toHaveLength(5);
    expect(bluff.result(rt.state)).toEqual({ winners: [0, 1, 2, 3], scores: [0, 0, 0, 0] });
    expect(rt.timeouts.every((t) => t >= 10)).toBe(true);
  });

  it("a full played match ranks the reader first", () => {
    let s = bluff.start(["a", "b", "c"], rng(), setup()).state;
    for (let r = 0; r < 5; r++) {
      s = bluff.tick?.(s, rng()).state ?? s;
      for (const i of [0, 1, 2]) s = bluff.apply(s, i, { type: "pass" }, rng()).state;
      s = bluff.apply(s, 0, { type: "lock", answer: 0, prediction: 1, wager: 2 }, rng()).state;
      s = bluff.apply(s, 1, { type: "lock", answer: 1, prediction: 0, wager: 0 }, rng()).state;
      s = bluff.apply(s, 2, { type: "lock", answer: 1, prediction: 3, wager: 1 }, rng()).state;
      s = bluff.tick?.(s, rng()).state ?? s; // reveal → score
      s = bluff.tick?.(s, rng()).state ?? s; // score → next read / finished
    }
    expect(bluff.isFinished(s)).toBe(true);
    // seat0: 4 ×4 + 8 = 24; seat1: Top = A,B tie → hit +2, crowd +1 → 3 ×4 + 6 = 18
    expect(s.scores).toEqual([24, 18, 0]); // seat2: −1 wager +1 crowd per round
    expect(bluff.result(s)?.winners).toEqual([0]);
    expect(bluff.view(s, null).placements).toEqual([1, 2, 3]);
  });
});
