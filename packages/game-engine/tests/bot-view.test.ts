import { describe, expect, it } from "vitest";
import { autoSubmit, botContext, chooseBotAction } from "../src/bots/auto.ts";
import { normalBot } from "../src/bots/strategy.ts";
import { validateAction } from "../src/rules/v1/actions.ts";
import { buildPlayerView } from "../src/views/player-view.ts";
import { rng, selectState } from "./scenario.ts";

const s3 = () =>
  selectState(
    ["pyro_pup", "aqua_otter", "breeze_kit"],
    [["attack", "support"], ["defense", "aoe"], ["redirect"]],
  );

describe("player view (3.10)", () => {
  it("contains only the viewer's hand and no private data", () => {
    const s = s3();
    s.submissions["p2"] = {
      playerId: "p2",
      cardInstanceId: s.hands["p2"]?.[0] ?? "",
      targetPlayerId: "p1",
    };
    const view = buildPlayerView(s, "p1");
    expect(view.myHand.map((c) => c.instanceId).sort()).toEqual([...(s.hands["p1"] ?? [])].sort());
    const json = JSON.stringify(view);
    for (const id of [...(s.hands["p2"] ?? []), ...(s.hands["p3"] ?? []), ...s.deck])
      expect(json).not.toContain(`"${id}"`);
    expect(json).not.toContain("skillState");
    expect(json).not.toContain("targetPlayerId");
    expect(view.players.find((p) => p.id === "p2")?.hasSubmitted).toBe(true);
  });

  it("non-players get no hand", () => {
    expect(buildPlayerView(s3(), null).myHand).toEqual([]);
    expect(buildPlayerView(s3(), "stranger").myHand).toEqual([]);
  });
});

describe("bot (3.11)", () => {
  it("only sees its own seat", () => {
    const s = s3();
    const ctx = botContext(s, "p2");
    const json = JSON.stringify(ctx);
    for (const id of [...(s.hands["p1"] ?? []), ...(s.hands["p3"] ?? []), ...s.deck])
      expect(json).not.toContain(`"${id}"`);
  });

  it("always picks a legal action across many seeds", () => {
    for (let seed = 1; seed < 60; seed++) {
      const s = s3();
      for (const id of ["p1", "p2", "p3"]) {
        const a = chooseBotAction(s, id, rng(seed));
        const cmd = {
          matchId: s.matchId,
          roundNumber: s.round,
          expectedVersion: s.version,
          cardInstanceId: a.cardInstanceId,
          idempotencyKey: "k",
          ...(a.targetPlayerId && { targetPlayerId: a.targetPlayerId }),
          ...(a.choice && { choice: a.choice }),
        };
        expect(validateAction(s, id, cmd).ok).toBe(true);
      }
    }
  });

  it("never heals at full HP and prefers defense/heal when low", () => {
    const full = selectState(["pyro_pup", "aqua_otter"], [["support"], ["defense"]]);
    expect(chooseBotAction(full, "p1", rng()).choice).toBe("draw");
    const low = selectState(["pyro_pup", "aqua_otter"], [["attack", "defense"], ["attack"]], {
      0: { hp: 1 },
    });
    expect(low.cards[chooseBotAction(low, "p1", rng()).cardInstanceId]?.effect).toBe("defense");
  });

  it("finishes off a 1 HP opponent", () => {
    const s = selectState(
      ["pyro_pup", "aqua_otter", "breeze_kit"],
      [["attack"], ["defense"], ["defense"]],
      { 2: { hp: 1 } },
    );
    expect(chooseBotAction(s, "p1", rng()).targetPlayerId).toBe("p3");
  });

  it("swaps with the highest-HP opponent (clarification Q7)", () => {
    const s = selectState(
      ["aqua_otter", "terra_tortoise", "pyro_pup"],
      [["attack"], ["attack"], ["attack"]],
    );
    expect(normalBot.chooseSwapTarget(botContext(s, "p1"), rng())).toBe("p2");
  });
});

describe("timeout auto-bot (3.12, Rule 14)", () => {
  it("submits for pending players and marks them auto", () => {
    const s = s3();
    const next = autoSubmit(s, ["p1", "p2", "p3"], rng());
    for (const id of ["p1", "p2", "p3"]) expect(next.submissions[id]?.auto).toBe(true);
  });

  it("does not overwrite an existing submission", () => {
    const s = s3();
    const existing = {
      playerId: "p1",
      cardInstanceId: s.hands["p1"]?.[0] ?? "",
      targetPlayerId: "p2",
    };
    s.submissions["p1"] = existing;
    expect(autoSubmit(s, ["p1"], rng()).submissions["p1"]).toEqual(existing);
  });
});
