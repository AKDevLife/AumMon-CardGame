import type { v6 } from "@aummon/game-engine";
import { describe, expect, it } from "vitest";
import {
  CARD_ART,
  commandLabel,
  commandSubjects,
  commandTarget,
  describeEvent,
  historyByTurn,
} from "./labels.ts";

const names = ["Aum", "Bot"] as const;

describe("ruleset 4 labels", () => {
  it("describes public events without hidden cards", () => {
    expect(describeEvent({ type: "card_drawn", seat: 0, instanceId: "p0-1" }, names)).toBeNull();
    expect(
      describeEvent(
        { type: "unit_summoned", seat: 1, instanceId: "x", cardId: "O01", exhausted: true },
        names,
      ),
    ).toBe("Bot ลง ดินสอไม้");
    expect(
      describeEvent(
        { type: "ability_activated", seat: 0, instanceId: "x", cardId: "O05", target: "y" },
        names,
      ),
    ).toBe('Aum: กรรไกร ใช้ "ตัดฉับ"');
    expect(describeEvent({ type: "match_ended", result: { winner: 0 } }, names)).toBe(
      "จบเกม: Aum ชนะ",
    );
  });

  it("labels commands, subjects and targets", () => {
    const view = {
      players: [
        { units: [{ instanceId: "s", cardId: "O05" }] },
        { units: [{ instanceId: "t", cardId: "O09" }] },
      ],
    } as unknown as v6.PlayerView;
    expect(commandLabel({ type: "attack", attackerId: "s", target: "player" }, view)).toBe(
      "⚔️ โจมตีผู้เล่น",
    );
    expect(commandLabel({ type: "activate", instanceId: "s", target: "t" }, view)).toBe(
      "✨ ตัดฉับ → ร่ม",
    );
    expect(commandSubjects({ type: "activate", instanceId: "s" })).toEqual(["s"]);
    expect(commandTarget({ type: "activate", instanceId: "s", target: "t" })).toBe("t");
    expect(commandSubjects({ type: "end_turn" })).toEqual([]);
  });

  it("every card has placeholder art", () => {
    expect(Object.keys(CARD_ART)).toHaveLength(24);
  });
});

describe("history", () => {
  it("groups by turn with the newest turn first", () => {
    const g = historyByTurn(
      [
        { type: "turn_started", seat: 0, turn: 1, spark: 1 },
        { type: "unit_summoned", seat: 0, instanceId: "a", cardId: "O01", exhausted: true },
        { type: "turn_started", seat: 1, turn: 2, spark: 1 },
        { type: "forfeit", seat: 1 },
      ],
      ["Aum", "Bot"],
    );
    expect(g.map((x) => x.title)).toEqual(["เทิร์น 2 · Bot", "เทิร์น 1 · Aum"]);
    expect(g[1]?.lines).toEqual(["Aum ลง ดินสอไม้"]);
  });
});
