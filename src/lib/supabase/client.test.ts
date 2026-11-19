import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("getSupabaseClient", () => {
  it("returns null in UI preview mode (no env)", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    const { getSupabaseClient } = await import("./client.ts");
    expect(getSupabaseClient()).toBeNull();
  });

  it("creates a client when configured", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_xyz");
    const { getSupabaseClient } = await import("./client.ts");
    expect(getSupabaseClient()).not.toBeNull();
  });

  it("throws on a secret key", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_secret_abcdef");
    const { getSupabaseClient } = await import("./client.ts");
    expect(() => getSupabaseClient()).toThrow(/secret/);
  });
});
