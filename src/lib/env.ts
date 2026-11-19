/**
 * Public (browser-safe) configuration.
 *
 * Only VITE_* variables reach the client bundle; they must hold public values
 * only (Supabase project URL + publishable/anon key). Secret / service-role
 * keys belong to Edge Functions and are rejected here as a safety net.
 */
export interface PublicEnv {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export type PublicEnvResult =
  | { status: "configured"; env: PublicEnv }
  | { status: "missing" }
  | { status: "invalid"; reason: string };

interface RawEnv {
  VITE_SUPABASE_URL?: string | undefined;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
}

function decodeJwtRole(token: string): string | undefined {
  const payload = token.split(".")[1];
  if (!payload) return undefined;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null && "role" in parsed) {
      const role = parsed.role;
      return typeof role === "string" ? role : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function isSecretLikeKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;
  return key.split(".").length === 3 && decodeJwtRole(key) === "service_role";
}

export function readPublicEnv(raw: RawEnv = import.meta.env): PublicEnvResult {
  const url = raw.VITE_SUPABASE_URL?.trim() ?? "";
  const key = raw.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!url && !key) return { status: "missing" };
  if (!url || !key)
    return { status: "invalid", reason: "Both Supabase URL and publishable key are required" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { status: "invalid", reason: "VITE_SUPABASE_URL is not a valid URL" };
  }
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !isLocal) {
    return { status: "invalid", reason: "VITE_SUPABASE_URL must use https" };
  }
  if (isSecretLikeKey(key)) {
    return {
      status: "invalid",
      reason: "A secret/service-role key must never be used in the browser",
    };
  }
  return { status: "configured", env: { supabaseUrl: url, supabasePublishableKey: key } };
}
