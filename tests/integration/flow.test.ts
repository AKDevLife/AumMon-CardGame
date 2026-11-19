import {
  initializeMatch,
  submitAction,
  type CardInstance,
  type CharacterDefinition,
  type CharacterHook,
} from "@aummon/game-engine";
import { describe, expect, it } from "vitest";
import { advance, type Runtime } from "../../supabase/functions/_shared/flow.ts";

const EFFECTS = { attack: 16, defense: 10, support: 8, redirect: 2, aoe: 2, disrupt: 2 } as const;
const cards: CardInstance[] = Object.entries(EFFECTS).flatMap(([effect, n]) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${effect}${i}`,
    definitionId: effect,
    type: (["redirect", "aoe", "disrupt"].includes(effect)
      ? "chaos"
      : effect) as CardInstance["type"],
    effect: effect as CardInstance["effect"],
    name: effect,
  })),
);
const char = (
  id: string,
  hook: CharacterHook,
  key: string,
  hp: number,
  speed: number,
): CharacterDefinition => ({
  id,
  name: id,
  element: "x",
  hp,
  speed,
  hook,
  effectKey: key,
  description: "",
  version: 1,
});

function solo(
  mode: "solo" | "pass_play" = "solo",
  humanChar = char("pyro_pup", "onAttack", "BONUS_DMG_FIRST_HIT", 3, 70),
): Runtime {
  const rng: [number, number, number, number] = [1, 2, 3, 4];
  const { state } = initializeMatch(
    {
      matchId: "m",
      mode,
      seats: [
        {
          playerId: "h",
          seat: 1,
          kind: mode === "pass_play" ? "local" : "human",
          displayName: "H",
          character: humanChar,
        },
        {
          playerId: "b",
          seat: 2,
          kind: mode === "pass_play" ? "local" : "bot",
          displayName: "B",
          character: char("breeze_kit", "onBeforeDamaged", "DISCARD_TO_DODGE", 3, 90),
        },
      ],
      cards,
    },
    { nextInt: (n) => n - 1 },
  );
  return { state, rng, deadline: null };
}

describe("server flow (advance)", () => {
  it("starts round 1, bot submits, waits for the human with a 30s deadline", () => {
    const r = advance(solo(), 1000);
    expect(r.state.round).toBe(1);
    expect(r.state.phase).toBe("select");
    expect(r.state.submissions["b"]?.auto).toBe(true);
    expect(r.state.submissions["h"]).toBeUndefined();
    expect(r.deadline).toBe(31_000);
  });

  it("resolves after the human submits and starts the next round", () => {
    const r1 = advance(solo(), 0);
    const card =
      r1.state.hands["h"]?.find((id) => r1.state.cards[id]?.effect === "defense") ??
      r1.state.hands["h"]?.[0] ??
      "";
    const effect = r1.state.cards[card]?.effect;
    const out = submitAction(r1.state, "h", {
      matchId: "m",
      roundNumber: 1,
      expectedVersion: r1.state.version,
      cardInstanceId: card,
      idempotencyKey: "k",
      ...(effect === "attack" || effect === "disrupt" || effect === "redirect"
        ? { targetPlayerId: "b" }
        : {}),
      ...(effect === "support" ? { choice: "draw" } : {}),
    });
    expect(out.result.ok).toBe(true);
    const r2 = advance({ ...r1, state: out.transition?.state ?? r1.state }, 5000);
    expect(r2.events.map((e) => e.type)).toContain("actions.revealed");
    expect(r2.state.round === 2 || r2.state.phase === "end").toBe(true);
  });

  it("auto-plays for the human after the 30s timeout (Rule 14)", () => {
    const r1 = advance(solo(), 0);
    const r2 = advance(r1, 30_000);
    expect(r2.events.some((e) => e.type === "timeout.auto")).toBe(true);
  });

  it("does not time out before the deadline", () => {
    const r1 = advance(solo(), 0);
    const r2 = advance(r1, 29_999);
    expect(r2.state.round).toBe(1);
    expect(r2.events).toEqual([]);
  });

  it("pass & play has no timeout (clarification Q11)", () => {
    const r1 = advance(solo("pass_play"), 0);
    expect(r1.deadline).toBeNull();
    expect(advance(r1, 10_000_000).state.round).toBe(1);
  });

  it("human Aqua gets a 15s skill window, skipped on timeout", () => {
    const r1 = advance(solo("solo", char("aqua_otter", "onTurnStart", "SWAP_CARD_ONCE", 3, 60)), 0);
    expect(r1.state.phase).toBe("turn_start");
    expect(r1.deadline).toBe(15_000);
    const r2 = advance(r1, 15_000);
    expect(r2.events.map((e) => e.type)).toContain("skill.skipped");
    expect(r2.state.phase).toBe("select");
  });

  it("a bot-only timeout game always terminates", () => {
    let r = advance(solo(), 0);
    for (let t = 1; t < 500 && r.state.phase !== "end"; t++) r = advance(r, t * 31_000);
    expect(r.state.phase).toBe("end");
  });

  it("recovery after a crash re-runs from the committed state with identical results (attack test 10)", () => {
    // A crash before commit rolls back the transaction; the next request re-runs
    // advance() from the same committed runtime. It must be deterministic and must
    // not mutate its input, so the round resolves exactly once with the same outcome.
    const committed = advance(solo(), 0);
    const snapshot = JSON.stringify(committed);
    const firstAttempt = advance(committed, 30_000); // "crashed" — never persisted
    const retry = advance(committed, 30_000);
    expect(JSON.stringify(committed)).toBe(snapshot);
    expect(JSON.stringify(retry)).toBe(JSON.stringify(firstAttempt));
    expect(retry.events.filter((e) => e.type === "actions.revealed")).toHaveLength(1);
  });
});
