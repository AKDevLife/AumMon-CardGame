import { describe, expect, it } from "vitest";
import { originAllowed } from "../../supabase/functions/_shared/origins.ts";

const patterns = ["http://localhost:5173", "https://*-aum-mon.vercel.app"];

describe("CORS origin allow-list", () => {
  it.each([
    ["http://localhost:5173", true],
    ["https://aum-mon-card-game-git-feat-x-aum-mon.vercel.app", true],
    ["https://evil.vercel.app", false],
    ["https://x-aum-mon.vercel.app.evil.com", false],
    ["http://x-aum-mon.vercel.app", false],
    ["https://localhost:5173", false],
  ])("%s → %s", (origin, expected) => {
    expect(originAllowed(origin, patterns)).toBe(expected);
  });
});
