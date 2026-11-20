import type { v2 } from "@aummon/game-engine";
import { describe, expect, it } from "vitest";
import { cardText, commandLabel, commandSubjects, describeEvent } from "./labels.ts";

const names = ["Aum", "Bot"] as const;

describe("ruleset 2 labels", () => {
  it("describes public events without hidden cards", () => {
    expect(describeEvent({ type: "card_drawn", seat: 0, instanceId: "p0-1" }, names)).toBeNull();
    expect(
      describeEvent(
        {
          type: "unit_summoned",
          seat: 1,
          instanceId: "x",
          cardId: "U001_RUBBER_DUCKLING",
          exhausted: false,
        },
        names,
      ),
    ).toBe("Bot ลง Rubber Duckling");
    expect(describeEvent({ type: "match_ended", result: { winner: 0 } }, names)).toBe(
      "จบเกม: Aum ชนะ",
    );
  });

  it("explains equipment and actions", () => {
    expect(cardText("E002")).toBe("+2 HP · ติดกับ CONTAINER/METAL");
    expect(cardText("A001")).toBe("จั่ว 2 ใบ");
  });

  it("labels commands and their subjects", () => {
    const view = {
      players: [
        { units: [], discard: [] },
        { units: [], discard: [] },
      ],
      myHand: [],
    } as unknown as v2.PlayerView;
    expect(commandLabel({ type: "attack", attackerId: "a", target: "player" }, view)).toBe(
      "⚔️ โจมตีผู้เล่น",
    );
    expect(commandLabel({ type: "play_action", instanceId: "h", choice: "E003" }, view)).toBe(
      "ใช้: Power Charger",
    );
    expect(commandSubjects({ type: "fuse", unitIds: ["a", "b"] })).toEqual(["a", "b"]);
    expect(commandSubjects({ type: "end_turn" })).toEqual([]);
  });
});
