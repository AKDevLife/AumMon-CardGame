import { createSeededRandom, v2 } from "@aummon/game-engine";
import { describe, expect, it } from "vitest";
import {
  actingSeat,
  advanceTcg,
  type TcgRuntime,
} from "../../supabase/functions/_shared/tcg-flow.ts";

const T = v2.RULESET_V2.turnTimeoutMs;

function runtime(): TcgRuntime {
  const rng = createSeededRandom([3, 1, 4, 1]);
  const state = v2.initializeMatch(
    { playerIds: ["h", "b"], decks: [v2.STARTER_DECK_V2, v2.STARTER_DECK_V2] },
    rng,
  );
  return { state, rng: rng.getState(), deadline: null };
}

describe("ruleset 2 server flow", () => {
  it("bot mulligans and plays its turns; human gets a 90 s deadline", () => {
    const out = advanceTcg(runtime(), ["human", "bot"], "solo", 1000);
    expect(out.state.players[1].mulliganDone).toBe(true);
    expect(actingSeat(out.state)).toBe(0);
    expect(out.deadline).toBe(1000 + T);
  });

  it("timeout ends the human turn (or keeps hand at mulligan) and the bot continues", () => {
    let rt: TcgRuntime = advanceTcg(runtime(), ["human", "bot"], "solo", 0);
    for (let i = 0; i < 4 && rt.state.status !== "finished"; i++) {
      const now = (rt.deadline ?? 0) + 1;
      const turn = rt.state.turn;
      rt = advanceTcg(rt, ["human", "bot"], "solo", now);
      expect(rt.state.turn).toBeGreaterThan(turn - (turn === 0 ? 0 : 0));
      expect(actingSeat(rt.state) === 0 || rt.state.status === "finished").toBe(true);
      expect(rt.deadline === null || rt.deadline === now + T).toBe(true);
    }
  });

  it("does nothing before the deadline", () => {
    const rt = advanceTcg(runtime(), ["human", "bot"], "solo", 0);
    const again = advanceTcg(rt, ["human", "bot"], "solo", (rt.deadline ?? 0) - 1);
    expect(again.state).toEqual(rt.state);
    expect(again.events).toEqual([]);
    expect(again.deadline).toBe(rt.deadline);
  });

  it("Pass & Play has no timer", () => {
    const out = advanceTcg(runtime(), ["local", "local"], "pass_play", 0);
    expect(out.deadline).toBeNull();
    expect(advanceTcg(out, ["local", "local"], "pass_play", 10 ** 12).state).toEqual(out.state);
  });

  it("bot vs bot plays to the end", () => {
    const out = advanceTcg(runtime(), ["bot", "bot"], "solo", 0);
    expect(out.state.status).toBe("finished");
  });
});
