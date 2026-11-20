import { describe, expect, it } from "vitest";
import { soundFor } from "./sound.ts";

describe("game sounds", () => {
  it("maps events to sounds", () => {
    expect(
      soundFor(
        {
          type: "unit_summoned",
          seat: 0,
          instanceId: "x",
          cardId: "U001_RUBBER_DUCKLING",
          exhausted: true,
        },
        0,
      ),
    ).toBe("summon");
    expect(soundFor({ type: "turn_started", seat: 1, turn: 2, spark: 1 }, 0)).toBeNull();
    expect(soundFor({ type: "turn_started", seat: 0, turn: 3, spark: 2 }, 0)).toBe("turn");
    expect(soundFor({ type: "match_ended", result: { winner: 1 } }, 0)).toBe("lose");
    expect(soundFor({ type: "match_ended", result: { winner: 0 } }, 0)).toBe("win");
    expect(soundFor({ type: "card_drawn", seat: 0, instanceId: "x" }, 0)).toBeNull();
  });
});
