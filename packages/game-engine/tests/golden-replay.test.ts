import { describe, expect, it } from "vitest";
import { createSeededRandom, type RngState } from "../src/rng/seeded-random.ts";
import { actingSeat, applyCommand, chooseBotCommand, startGame } from "../src/discard/index.ts";

/**
 * Golden replay (Game Center GC1.1): fixed seeds + bot play must reproduce the exact same
 * events and final state. Guards EDO Battle (ruleset "13") against any behaviour change while
 * the platform is refactored. Update the snapshot ONLY with an owner-approved ruleset change.
 */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

function replay(players: number, seed: RngState) {
  const rng = createSeededRandom(seed);
  const ids = Array.from({ length: players }, (_, i) => `p${String(i)}`);
  const start = startGame(ids, rng);
  let state = start.state;
  const log: unknown[] = [...start.events];
  let steps = 0;
  for (let seat = actingSeat(state); seat !== null; seat = actingSeat(state)) {
    if (++steps > 5000) throw new Error("game did not finish");
    const t = applyCommand(state, chooseBotCommand(state, seat, rng), rng);
    state = t.state;
    log.push(...t.events);
  }
  return {
    players,
    steps,
    winner: state.winner,
    turns: state.turnNumber,
    events: fnv1a(JSON.stringify(log)),
    state: fnv1a(JSON.stringify(state)),
  };
}

describe("EDO Battle golden replay (ruleset 13)", () => {
  const seeds: RngState[] = [
    [1, 2, 3, 4],
    [42, 7, 99, 1234],
    [0xdeadbeef, 0x1234, 0x5678, 0x9abc],
  ];
  for (let players = 2; players <= 8; players++) {
    it(`${String(players)} players`, () => {
      expect(seeds.map((seed) => replay(players, seed))).toMatchSnapshot();
    });
  }
});
