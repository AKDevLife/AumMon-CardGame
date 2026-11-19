import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = readFileSync("supabase/config.toml", "utf8");

describe("supabase/config.toml", () => {
  it("never exposes the private schema through the Data API", () => {
    const line = /^schemas\s*=\s*\[(.*)\]/m.exec(config);
    expect(line).not.toBeNull();
    const schemas = (line?.[1] ?? "").split(",").map((s) => s.trim().replace(/"/g, ""));
    expect(schemas).not.toContain("private");
  });
});
