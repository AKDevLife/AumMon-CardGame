import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  applyCommand,
  CARD_DEFINITIONS_V6,
  chooseBotCommand,
  getLegalCommands,
  getPlayerView,
  initializeMatch,
  STARTER_DECK_V6,
  validateCardData,
  type Command,
  type LegalCommand,
  type MatchState,
  type Seat,
} from "../src/rules/v6/index.ts";

function toCommand(s: MatchState, seat: Seat, legal: LegalCommand): Command {
  const playerId = s.players[seat].playerId;
  return legal.type === "mulligan"
    ? { type: "mulligan", playerId, instanceIds: [] }
    : { ...legal, playerId };
}

const ids = (s: MatchState, seat: Seat) => {
  const p = s.players[seat];
  return [...p.deck, ...p.hand, ...p.discard, ...p.units].map((c) => c.instanceId).sort();
};

/** Plays one match; each seat is the bot or a random player (end_turn de-weighted). */
function playMatch(seed: number, bots: readonly [boolean, boolean]): MatchState {
  const rng = createSeededRandom([seed, 17, 29, 31]);
  const pick = createSeededRandom([seed, 3, 5, 7]);
  let s = initializeMatch(
    { playerIds: ["a", "b"], decks: [STARTER_DECK_V6, STARTER_DECK_V6] },
    rng,
  );
  for (let n = 0; s.status !== "finished"; n++) {
    if (n > 3000) throw new Error(`seed ${seed}: match did not finish`);
    const seat: Seat = s.status === "mulligan" ? (s.players[0].mulliganDone ? 1 : 0) : s.activeSeat;
    const legal = getLegalCommands(s, seat);
    expect(legal.length).toBeGreaterThan(0);
    let choice: LegalCommand | undefined;
    if (bots[seat]) choice = chooseBotCommand(getPlayerView(s, seat), legal, pick);
    else {
      const nonEnd = legal.filter((c) => c.type !== "end_turn");
      const pool = nonEnd.length > 0 && pick.nextInt(4) > 0 ? nonEnd : legal;
      choice = pool[pick.nextInt(pool.length)];
    }
    if (!choice) throw new Error("no choice");
    s = applyCommand(s, toCommand(s, seat, choice), rng).state;
    for (const seat2 of [0, 1] as const) {
      const p = s.players[seat2];
      expect(new Set(ids(s, seat2)).size).toBe(30);
      expect(p.units.length).toBeLessThanOrEqual(3);
      expect(p.hand.length).toBeLessThanOrEqual(10);
      expect(p.hp).toBeLessThanOrEqual(20);
      expect(p.spark).toBeGreaterThanOrEqual(0);
    }
  }
  return s;
}

const winner = (s: MatchState): Seat | "draw" => {
  if (!s.result) throw new Error("no result");
  return "draw" in s.result ? "draw" : s.result.winner;
};

describe("ruleset 3 card data", () => {
  it("24 Objects: 8 Passive-only, 8 Active-only, 8 Dual; 6 per archetype", () => {
    const kind = (c: (typeof CARD_DEFINITIONS_V6)[number]) =>
      c.passive && c.active ? "dual" : c.passive ? "passive" : "active";
    const count = (k: string) => CARD_DEFINITIONS_V6.filter((c) => kind(c) === k).length;
    expect(CARD_DEFINITIONS_V6).toHaveLength(24);
    expect([count("passive"), count("active"), count("dual")]).toEqual([8, 8, 8]);
    for (const a of ["aggro", "defensive", "control", "synergy"])
      expect(CARD_DEFINITIONS_V6.filter((c) => c.archetype === a)).toHaveLength(6);
  });

  it("validates with no errors and inside the power budget", () => {
    const r = validateCardData(CARD_DEFINITIONS_V6, STARTER_DECK_V6);
    expect(r.errors).toEqual([]);
    expect(r.budgetFlags).toEqual([]);
  });
});

describe("ruleset 3 simulation", { timeout: 120_000 }, () => {
  it("1,000 random matches finish without errors or broken invariants", () => {
    for (let seed = 1; seed <= 1000; seed++)
      expect(playMatch(seed, [false, false]).status).toBe("finished");
  });

  it("bot vs bot matches finish (200)", () => {
    const r = { 0: 0, 1: 0, draw: 0 };
    for (let seed = 1; seed <= 200; seed++) r[winner(playMatch(seed, [true, true]))]++;
    expect(r[0]).toBeGreaterThan(0);
    expect(r[1]).toBeGreaterThan(0);
  });

  it("the bot beats a random player in most of 100 matches", () => {
    let wins = 0;
    for (let seed = 1; seed <= 100; seed++)
      if (winner(playMatch(seed, [true, false])) === 0) wins++;
    expect(wins).toBeGreaterThanOrEqual(80);
  });

  it("is deterministic and views hide the opponent hand and deck", () => {
    const s = playMatch(42, [true, false]);
    expect(playMatch(42, [true, false])).toEqual(s);
    for (const seat of [0, 1] as const) {
      const json = JSON.stringify(getPlayerView(s, seat));
      const foe = s.players[seat === 0 ? 1 : 0];
      for (const c of [...foe.hand, ...foe.deck]) expect(json).not.toContain(`"${c.instanceId}"`);
    }
  });
});
