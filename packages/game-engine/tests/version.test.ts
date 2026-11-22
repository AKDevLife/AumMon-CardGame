import { describe, expect, it } from "vitest";
import { ENGINE_VERSION, RULESET_VERSION } from "../src/index.ts";

describe("engine versioning", () => {
  it("is ruleset 12 (owner card changes)", () => {
    expect(RULESET_VERSION).toBe("12");
  });

  it("exposes a semver engine version", () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
