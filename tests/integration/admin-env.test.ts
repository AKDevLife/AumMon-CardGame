import { describe, expect, it } from "vitest";
import { parseAppEnv } from "../../supabase/functions/_shared/env.ts";

describe("admin environment tier", () => {
  it("only explicit development/staging values enable lower tiers", () => {
    expect(parseAppEnv("development")).toBe("development");
    expect(parseAppEnv("staging")).toBe("staging");
    expect(parseAppEnv(undefined)).toBe("production");
    expect(parseAppEnv("DEVELOPMENT")).toBe("production");
    expect(parseAppEnv("")).toBe("production");
  });
});
