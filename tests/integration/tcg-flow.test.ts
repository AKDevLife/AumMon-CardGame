import { createSeededRandom, v4 } from "@aummon/game-engine";
import { describe, expect, it } from "vitest";
import {
  actingSeat,
  advanceTcg,
  BOT_STEP_MS,
  type Kind,
  type TcgRuntime,
} from "../../supabase/functions/_shared/tcg-flow.ts";

const T = v4.RULESET_V4.turnTimeoutMs;

function runtime(): TcgRuntime {
  const rng = createSeededRandom([3, 1, 4, 1]);
  const state = v4.initializeMatch(
    { playerIds: ["h", "b"], decks: [v4.STARTER_DECK_V4, v4.STARTER_DECK_V4] },
    rng,
  );
  return { state, rng: rng.getState(), deadline: null };
}

/** Advances through paced bot steps until a human must act (or the game ends). */
function untilHuman(
  rt: TcgRuntime,
  kinds: [Kind, Kind],
  now: number,
): { rt: TcgRuntime; now: number; steps: number } {
  let steps = 0;
  let out = advanceTcg(rt, kinds, "solo", now);
  for (; steps < 500; steps++) {
    const seat = actingSeat(out.state);
    if (out.state.status === "finished" || seat === null || kinds[seat] !== "bot") break;
    now = out.deadline ?? now;
    out = advanceTcg(out, kinds, "solo", now);
  }
  return { rt: out, now, steps };
}

describe("ruleset 2 server flow", () => {
  it("bot mulligans at once; human gets a 90 s deadline", () => {
    const out = advanceTcg(runtime(), ["human", "bot"], "solo", 1000);
    expect(out.state.players[1].mulliganDone).toBe(true);
    expect(actingSeat(out.state)).toBe(0);
    expect(out.deadline).toBe(1000 + T);
  });

  it("bot turns are paced: one action per step, BOT_STEP_MS apart", () => {
    const kinds: [Kind, Kind] = ["human", "bot"];
    const rng = createSeededRandom([1, 2, 3, 4]);
    let rt = advanceTcg(runtime(), kinds, "solo", 0);
    const human = rt.state.players[0].playerId;
    rt = advanceTcg(
      {
        ...rt,
        state: v4.applyCommand(
          rt.state,
          { type: "mulligan", playerId: human, instanceIds: [] },
          rng,
        ).state,
      },
      kinds,
      "solo",
      10,
    );
    // Human ends turns until the bot is mid-turn (a bot may end its own turn in one step).
    for (let i = 0; i < 6 && actingSeat(rt.state) === 0; i++)
      rt = advanceTcg(
        {
          ...rt,
          state: v4.applyCommand(rt.state, { type: "end_turn", playerId: human }, rng).state,
          deadline: null,
        },
        kinds,
        "solo",
        20 + i,
      );
    // The bot is acting now: nothing happens before its next step time.
    expect(actingSeat(rt.state)).toBe(1);
    const at = rt.deadline ?? 0;
    expect(advanceTcg(rt, kinds, "solo", at - 1).events).toEqual([]);
    const step = advanceTcg(rt, kinds, "solo", at);
    expect(step.events.length).toBeGreaterThan(0);
    if (actingSeat(step.state) === 1) expect(step.deadline).toBe(at + BOT_STEP_MS);
  });

  it("timeout ends the human turn (or keeps hand at mulligan) and the bot continues", () => {
    let rt: TcgRuntime = advanceTcg(runtime(), ["human", "bot"], "solo", 0);
    let now = 0;
    for (let i = 0; i < 4 && rt.state.status !== "finished"; i++) {
      now = (rt.deadline ?? now) + 1;
      const r = untilHuman(rt, ["human", "bot"], now);
      rt = r.rt;
      now = r.now;
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

  it("bot vs bot plays to the end through paced steps", () => {
    const { rt, steps } = untilHuman(runtime(), ["bot", "bot"], 0);
    expect(rt.state.status).toBe("finished");
    expect(steps).toBeGreaterThan(10);
  });
});
