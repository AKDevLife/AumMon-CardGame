import { describe, expect, it } from "vitest";
import { isSecretLikeKey, readPublicEnv } from "./env.ts";

function jwt(payload: object): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${b64({ alg: "HS256" })}.${b64(payload)}.signature`;
}

describe("readPublicEnv", () => {
  it("reports missing when nothing is set (UI preview mode)", () => {
    expect(readPublicEnv({})).toEqual({ status: "missing" });
  });

  it("accepts https URL + publishable key", () => {
    const r = readPublicEnv({
      VITE_SUPABASE_URL: "https://abc.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_xyz",
    });
    expect(r.status).toBe("configured");
  });

  it("accepts local http URL", () => {
    const r = readPublicEnv({
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_PUBLISHABLE_KEY: jwt({ role: "anon" }),
    });
    expect(r.status).toBe("configured");
  });

  it.each([
    [{ VITE_SUPABASE_URL: "https://abc.supabase.co" }, "required"],
    [{ VITE_SUPABASE_URL: "not a url", VITE_SUPABASE_PUBLISHABLE_KEY: "k" }, "valid URL"],
    [{ VITE_SUPABASE_URL: "http://abc.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "k" }, "https"],
    [
      {
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_abc",
      },
      "secret",
    ],
    [
      {
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: jwt({ role: "service_role" }),
      },
      "secret",
    ],
  ])("rejects invalid config %#", (raw, reason) => {
    const r = readPublicEnv(raw);
    expect(r.status).toBe("invalid");
    expect(r.status === "invalid" && r.reason).toContain(reason);
  });
});

describe("isSecretLikeKey", () => {
  it("does not flag anon JWTs or publishable keys", () => {
    expect(isSecretLikeKey(jwt({ role: "anon" }))).toBe(false);
    expect(isSecretLikeKey("sb_publishable_abc")).toBe(false);
  });
});
