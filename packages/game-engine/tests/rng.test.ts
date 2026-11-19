import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/rng/seeded-random.ts";

describe("seeded RNG", () => {
  it("is deterministic for the same seed", () => {
    const a = createSeededRandom([1, 2, 3, 4]);
    const b = createSeededRandom([1, 2, 3, 4]);
    const seqA = Array.from({ length: 20 }, () => a.nextInt(1000));
    const seqB = Array.from({ length: 20 }, () => b.nextInt(1000));
    expect(seqA).toEqual(seqB);
  });

  it("resumes identically from a saved state (replay/recovery)", () => {
    const a = createSeededRandom([9, 8, 7, 6]);
    a.nextInt(10);
    const resumed = createSeededRandom(a.getState());
    expect(Array.from({ length: 10 }, () => resumed.nextInt(50))).toEqual(
      Array.from({ length: 10 }, () => a.nextInt(50)),
    );
  });

  it("stays in range and covers all values", () => {
    const rng = createSeededRandom([5, 6, 7, 8]);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.nextInt(6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
      seen.add(v);
    }
    expect(seen.size).toBe(6);
  });

  it("rejects bad input", () => {
    expect(() => createSeededRandom([0, 0, 0, 0])).toThrow();
    expect(() => createSeededRandom([1, 1, 1, 1]).nextInt(0)).toThrow(RangeError);
    expect(() => createSeededRandom([1, 1, 1, 1]).nextInt(1.5)).toThrow(RangeError);
  });
});
