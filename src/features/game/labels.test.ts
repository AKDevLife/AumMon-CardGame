import { describe, expect, it } from "vitest";
import { describeEvent } from "./labels.ts";

const name = (id: unknown) => (id === "a" ? "Aum" : "Bot");

describe("describeEvent", () => {
  it("renders hits with shield/bonus notes", () => {
    expect(
      describeEvent(
        {
          type: "hit",
          round: 1,
          publicPayload: { attackerId: "a", targetId: "b", damage: 2, absorbed: 0, bonus: 1 },
        },
        name,
      ),
    ).toBe("Aum ทำดาเมจ 2 ใส่ Bot (+1 โบนัส)");
  });
  it("renders revealed actions without hidden info", () => {
    const line = describeEvent(
      {
        type: "actions.revealed",
        round: 1,
        publicPayload: {
          actions: [{ playerId: "a", definitionId: "support", choice: "heal", auto: true }],
        },
      },
      name,
    );
    expect(line).toBe("Aum: Support (ฟื้น) [อัตโนมัติ]");
  });
  it("ignores unknown events", () => {
    expect(describeEvent({ type: "card.draw", round: 1, publicPayload: {} }, name)).toBeNull();
  });
});
