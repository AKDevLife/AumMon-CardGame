import { describe, expect, it } from "vitest";
import { ENGINE_VERSION, RULESET_VERSION } from "../src/index.ts";

describe("engine versioning", () => {
  it("is ruleset 11 (7 / 5 cards, 60 s turns)", () => {
    expect(RULESET_VERSION).toBe("11");
  });

  it("exposes a semver engine version", () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
