import { createSeededRandom, discard } from "@aummon/game-engine";
import { describe, expect, it } from "vitest";
import {
  actingSeat,
  advanceGame,
  BOT_STEP_MS,
  deadlineAfterAct,
  effectiveKinds,
  type GameRuntime,
  type Kind,
} from "../../supabase/functions/_shared/game-flow.ts";

function runtime(players: number, seed = 3): GameRuntime {
  const rng = createSeededRandom([seed, 1, 4, 1]);
  const { state } = discard.startGame(
    Array.from({ length: players }, (_, i) => `p${String(i)}`),
    rng,
  );
  return { state, rng: rng.getState(), deadline: null, timeouts: [] };
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
      if (seat === 0 && out.state.reactions.length === 0 && !out.state.drawn)
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

  it("timeout = draw & pass with a timeout event; a playable drawn card is kept", () => {
    const kinds: Kind[] = ["human", "human"];
    const start = advanceGame(runtime(2, 7), kinds, 0, "online");
    const seat = actingSeat(start.state) ?? 0;
    const before = start.state.players[seat]?.hand.length ?? 0;
    const out = advanceGame(start, kinds, (start.deadline ?? 0) + 1, "online");
    expect(out.events[0]).toEqual({ type: "timeout", seat });
    expect(out.state.drawn ?? null).toBeNull();
    expect(out.state.players[seat]?.hand.length).toBe(before + 1);
    expect(actingSeat(out.state)).not.toBe(seat);
    expect(out.timeouts[seat]).toBe(1);
  });

  it("Online: two timeouts in a row → the server plays that seat (QM4); Solo never", () => {
    const rt = { ...runtime(2, 9), timeouts: [2, 0] };
    expect(effectiveKinds(["human", "human"], rt.timeouts, "online")).toEqual(["bot", "human"]);
    expect(effectiveKinds(["human", "human"], rt.timeouts, "solo")).toEqual(["human", "human"]);
  });

  it("deciding on a drawn card always gets at least 5 seconds", () => {
    const rt = runtime(2, 11);
    const seat = actingSeat(rt.state) ?? 0;
    const playerId = rt.state.players[seat]?.playerId ?? "";
    // Make the next draw playable.
    const top = rt.state.pile[rt.state.pile.length - 1];
    if (top) rt.state.drawPile.unshift({ id: "x", cardId: "D03" });
    const drawn = discard.applyCommand(
      rt.state,
      { type: "draw", playerId },
      createSeededRandom(rt.rng),
    );
    expect(drawn.state.drawn?.id).toBe("x");
    const out = advanceGame({ ...rt, state: drawn.state, deadline: 1000 }, ["human", "human"], 900);
    expect(out.deadline).toBe(900 + discard.DISCARD_RULES.drawnDecisionMinMs);
  });

  it("a bot's drawn card never delays the bot (regression)", () => {
    const kinds: Kind[] = ["bot", "bot", "bot"];
    let rt = runtime(3, 5);
    let now = 0;
    for (let i = 0; i < 2000 && rt.state.status === "active"; i++) {
      rt = advanceGame(rt, kinds, now);
      now = rt.deadline ?? now + 1;
    }
    expect(rt.state.status).toBe("finished");
  });

  it("every new turn gets a fresh timer; the same seat keeps it only while deciding on a drawn card", () => {
    const rt = runtime(2, 21);
    const seat = actingSeat(rt.state) ?? 0;
    const playerId = rt.state.players[seat]?.playerId ?? "";
    const rng = createSeededRandom(rt.rng);
    rt.state.drawPile.unshift({ id: "x", cardId: "D11" }); // 1 point: cannot be played
    const passed = discard.applyCommand(rt.state, { type: "draw", playerId }, rng).state;
    expect(deadlineAfterAct(rt.state, passed, 5000)).toBeNull();
    const fresh = advanceGame({ ...rt, state: passed, deadline: null }, ["human", "human"], 4000);
    expect(fresh.deadline).toBe(4000 + discard.DISCARD_RULES.turnTimeoutMs);
    const rt2 = runtime(2, 22);
    rt2.state.drawPile.unshift({ id: "y", cardId: "D03" }); // Eraser: always playable
    const s2 = actingSeat(rt2.state) ?? 0;
    const pending = discard.applyCommand(
      rt2.state,
      { type: "draw", playerId: rt2.state.players[s2]?.playerId ?? "" },
      createSeededRandom(rt2.rng),
    ).state;
    expect(deadlineAfterAct(rt2.state, pending, 5000)).toBe(5000);
  });
});
