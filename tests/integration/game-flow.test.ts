import { createSeededRandom, discard } from "@aummon/game-engine";
import { describe, expect, it } from "vitest";
import {
  actingSeat,
  advanceGame,
  BOT_STEP_MS,
  type GameRuntime,
  type Kind,
} from "../../supabase/functions/_shared/game-flow.ts";

function runtime(players: number, seed = 3): GameRuntime {
  const rng = createSeededRandom([seed, 1, 4, 1]);
  const { state } = discard.startGame(
    Array.from({ length: players }, (_, i) => `p${String(i)}`),
    rng,
  );
  return { state, rng: rng.getState(), deadline: null };
}

describe("discard server flow", () => {
  it("bots are paced one action per step; a human gets the turn timer", () => {
    const kinds: Kind[] = ["human", "bot", "bot", "bot"];
    let rt = runtime(4);
    let now = 0;
    for (let i = 0; i < 200 && rt.state.status === "active"; i++) {
      const out = advanceGame(rt, kinds, now);
      const seat = actingSeat(out.state);
      if (seat !== null && kinds[seat] === "bot") expect(out.deadline).toBe(now + BOT_STEP_MS);
      if (seat === 0 && out.state.reactions.length === 0)
        expect(out.deadline).toBe(now + discard.DISCARD_RULES.turnTimeoutMs);
      rt = out;
      now = (out.deadline ?? now) + 1; // human times out → auto draw & pass
    }
    expect(rt.state.status).toBe("finished");
  });

  it("nothing happens before a bot's step time", () => {
    const kinds: Kind[] = ["bot", "bot"];
    const first = advanceGame(runtime(2), kinds, 0);
    if (first.state.status === "active" && first.deadline !== null)
      expect(advanceGame(first, kinds, first.deadline - 1).events).toEqual([]);
  });
});
