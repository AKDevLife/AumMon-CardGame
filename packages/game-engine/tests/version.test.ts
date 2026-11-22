import { describe, expect, it } from "vitest";
import { ENGINE_VERSION, RULESET_VERSION } from "../src/index.ts";

describe("engine versioning", () => {
  it("is ruleset 9 (Quick Match + balance pack)", () => {
    expect(RULESET_VERSION).toBe("9");
  });

  it("exposes a semver engine version", () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
