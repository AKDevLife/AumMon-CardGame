import { describe, expect, it } from "vitest";
import { autoSubmit, botContext } from "../src/bots/auto.ts";
import { normalBot } from "../src/bots/strategy.ts";
import { getPlayer, isAlive } from "../src/domain/state.ts";
import type { GameState } from "../src/domain/types.ts";
import { createSeededRandom } from "../src/rng/seeded-random.ts";
import { countCards } from "../src/rules/v1/deck.ts";
import { resolveRound } from "../src/rules/v1/resolve.ts";
import {
  aquaEligible,
  pendingPlayers,
  startRound,
  useTurnStartSkill,
} from "../src/rules/v1/round.ts";
import { initializeMatch } from "../src/rules/v1/setup.ts";
import { matchInput } from "./fixtures.ts";

const ALL = ["pyro_pup", "aqua_otter", "breeze_kit", "terra_tortoise"];

function playOut(seed: number, players: number) {
  const rng = createSeededRandom([seed, seed * 7 + 1, 3, 4]);
  let state: GameState = initializeMatch(matchInput(ALL.slice(0, players)), rng).state;
  const eventLog: string[] = [];
  let rounds = 0;
  while (state.result.status === "ongoing" && rounds < 200) {
    state = startRound(state, rng).state;
    const aqua = aquaEligible(state);
    if (state.phase === "turn_start" && aqua) {
      const target = normalBot.chooseSwapTarget(botContext(state, aqua), rng);
      state = useTurnStartSkill(
        state,
        aqua,
        target ? { kind: "swap", targetPlayerId: target } : { kind: "skip" },
        rng,
      ).state;
    }
    state = autoSubmit(state, pendingPlayers(state), rng);
    const dead = new Set(state.players.filter((p) => !isAlive(p)).map((p) => p.id));
    const t = resolveRound(state, rng);
    for (const e of t.events) {
      eventLog.push(e.type);
      // eliminated players never act again
      if (e.type === "hit") expect(dead.has(String(e.publicPayload["attackerId"]))).toBe(false);
    }
    state = t.state;
    rounds++;
    // invariants every round
    expect(countCards(state)).toBe(40);
    for (const p of state.players) {
      expect(p.hp).toBeLessThanOrEqual(p.maxHp);
      if (p.hp <= 0) expect(p.status).toBe("eliminated");
      if (!isAlive(p)) expect(state.hands[p.id]).toEqual([]);
    }
  }
  return { state, rounds, eventLog };
}

describe("simulation (3.13) — random bot games", () => {
  it.each([2, 3, 4])("%i-player games finish with consistent invariants", (players) => {
    for (let seed = 1; seed <= 25; seed++) {
      const { state, rounds } = playOut(seed, players);
      expect(state.result.status).not.toBe("ongoing");
      expect(rounds).toBeLessThan(200);
      if (state.result.status === "win")
        expect(getPlayer(state, state.result.winnerId).status).toBe("alive");
      expect(state.phase).toBe("end");
    }
  });

  it("is fully deterministic for the same seed", () => {
    expect(JSON.stringify(playOut(42, 4))).toBe(JSON.stringify(playOut(42, 4)));
  });
});
