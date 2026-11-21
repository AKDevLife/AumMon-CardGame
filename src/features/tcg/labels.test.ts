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
    ).toBe("Bot ลง เป็ดยางจิ๋ว");
    expect(describeEvent({ type: "match_ended", result: { winner: 0 } }, names)).toBe(
      "จบเกม: Aum ชนะ",
    );
  });

  it("explains equipment and actions", () => {
    expect(cardText("E002")).toBe("พลังชีวิต +2 · ติดกับสายภาชนะ/สายโลหะ");
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
      "ใช้: ที่ชาร์จพลัง",
    );
    expect(commandSubjects({ type: "fuse", unitIds: ["a", "b"] })).toEqual(["a", "b"]);
    expect(commandSubjects({ type: "end_turn" })).toEqual([]);
  });
});

import { historyByTurn } from "./labels.ts";

describe("history", () => {
  it("groups by turn with the newest turn first", () => {
    const g = historyByTurn(
      [
        { type: "turn_started", seat: 0, turn: 1, spark: 1 },
        {
          type: "unit_summoned",
          seat: 0,
          instanceId: "a",
          cardId: "U001_RUBBER_DUCKLING",
          exhausted: false,
        },
        { type: "turn_started", seat: 1, turn: 2, spark: 1 },
        { type: "forfeit", seat: 1 },
      ],
      ["Aum", "Bot"],
    );
    expect(g.map((x) => x.title)).toEqual(["เทิร์น 2 · Bot", "เทิร์น 1 · Aum"]);
    expect(g[1]?.lines).toEqual(["Aum ลง เป็ดยางจิ๋ว"]);
  });
});
