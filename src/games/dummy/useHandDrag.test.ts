import { describe, expect, it } from "vitest";
import { reorder } from "./useHandDrag.ts";

describe("hand reorder", () => {
  it("moves a card to the position of the card it is dragged over", () => {
    expect(reorder(["A", "B", "C", "D"], "A", "C")).toEqual(["B", "C", "A", "D"]);
    expect(reorder(["A", "B", "C", "D"], "D", "B")).toEqual(["A", "D", "B", "C"]);
    expect(reorder(["A", "B"], "A", "X")).toEqual(["A", "B"]);
  });
});
