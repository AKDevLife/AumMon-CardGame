import { describe, expect, it } from "vitest";
import { ENGINE_VERSION, RULESET_VERSION } from "../src/index.ts";

describe("engine versioning", () => {
  it("is locked to Rulebook v1", () => {
    expect(RULESET_VERSION).toBe("1");
  });

  it("exposes a semver engine version", () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
