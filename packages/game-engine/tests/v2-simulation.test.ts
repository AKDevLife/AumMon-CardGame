import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import {
  applyCommand,
  getLegalCommands,
  getPlayerView,
  initializeMatch,
  STARTER_DECK_V2,
  type Command,
  type LegalCommand,
  type MatchState,
  type Seat,
} from "../src/rules/v2/index.ts";

const IDS = ["p0", "p1"] as const;
const MAX_COMMANDS = 3000;

function toCommand(s: MatchState, seat: Seat, legal: LegalCommand): Command {
  const playerId = s.players[seat].playerId;
  return legal.type === "mulligan"
    ? { type: "mulligan", playerId, instanceIds: [] }
    : { ...legal, playerId };
}

/** Deck-origin instances (p0-*, p1-*) are never lost or duplicated; fusion results are extra. */
function deckOrigin(s: MatchState, seat: Seat): string[] {
  const p = s.players[seat];
  const ids = [
    ...p.deck,
    ...p.hand,
    ...p.discard,
    ...p.units,
    ...p.units.flatMap((u) => u.equipment),
  ].map((c) => c.instanceId);
  return ids.filter((id) => id.startsWith(`p${seat}-`)).sort();
}

/** Plays a whole match picking uniformly among legal commands (end_turn de-weighted). */
function playRandom(seed: number): { state: MatchState; commands: number } {
  const rng = createSeededRandom([seed, 17, 29, 31]);
  const picker = createSeededRandom([seed, 3, 5, 7]);
  let state = initializeMatch({ playerIds: IDS, decks: [STARTER_DECK_V2, STARTER_DECK_V2] }, rng);
  let commands = 0;
  while (state.status !== "finished" && commands < MAX_COMMANDS) {
    const seat: Seat =
      state.status === "mulligan" ? (state.players[0].mulliganDone ? 1 : 0) : state.activeSeat;
    const legal = getLegalCommands(state, seat);
    expect(legal.length).toBeGreaterThan(0);
    const nonEnd = legal.filter((c) => c.type !== "end_turn");
    const pool = nonEnd.length > 0 && picker.nextInt(4) > 0 ? nonEnd : legal;
    const choice = pool[picker.nextInt(pool.length)];
    if (!choice) throw new Error("empty pool");
    state = applyCommand(state, toCommand(state, seat, choice), rng).state;
    commands++;
    for (const s of [0, 1] as const) {
      expect(deckOrigin(state, s)).toHaveLength(30);
      expect(new Set(deckOrigin(state, s)).size).toBe(30);
      const p = state.players[s];
      expect(p.units.length).toBeLessThanOrEqual(3);
      expect(p.hand.length).toBeLessThanOrEqual(10);
      expect(p.spark).toBeGreaterThanOrEqual(0);
      expect(p.maxSpark).toBeLessThanOrEqual(8);
    }
  }
  return { state, commands };
}

describe("ruleset 2 simulation", () => {
  it("200 random matches finish with valid invariants", () => {
    const results = { 0: 0, 1: 0, draw: 0 };
    for (let seed = 1; seed <= 200; seed++) {
      const { state } = playRandom(seed);
      expect(state.status).toBe("finished");
      if (!state.result) throw new Error("no result");
      if ("draw" in state.result) results.draw++;
      else results[state.result.winner]++;
    }
    expect(results[0] + results[1] + results.draw).toBe(200);
    expect(results[0]).toBeGreaterThan(0);
    expect(results[1]).toBeGreaterThan(0);
  });

  it("is deterministic: same seed → same final state", () => {
    expect(playRandom(42).state).toEqual(playRandom(42).state);
  });

  it("player views never contain opponent hand or deck instances", () => {
    const { state } = playRandom(7);
    for (const seat of [0, 1] as const) {
      const json = JSON.stringify(getPlayerView(state, seat));
      const foe = state.players[seat === 0 ? 1 : 0];
      for (const c of [...foe.hand, ...foe.deck]) expect(json).not.toContain(`"${c.instanceId}"`);
    }
  });
});
