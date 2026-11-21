import { describe, expect, it } from "vitest";
import { sortByCost } from "./sort.ts";

describe("sortByCost", () => {
  it("orders cheapest first, then by tie-breaker, then id", () => {
    const hand = [
      { cardId: "O17", id: "a" },
      { cardId: "O01", id: "b" },
      { cardId: "O09", id: "c" },
      { cardId: "O08", id: "d" },
    ];
    expect(sortByCost(hand).map((c) => c.cardId)).toEqual(["O01", "O08", "O09", "O17"]);
    expect(sortByCost(hand, (c) => (c.cardId === "O08" ? 0 : 1)).map((c) => c.cardId)).toEqual([
      "O08",
      "O01",
      "O09",
      "O17",
    ]);
  });
});
