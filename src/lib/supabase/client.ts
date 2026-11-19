import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readPublicEnv, type PublicEnvResult } from "../env.ts";

let cached: SupabaseClient | null | undefined;

/** Backend configuration state, used by the UI to show "not connected" honestly. */
export function getBackendStatus(): PublicEnvResult {
  return readPublicEnv();
}

/**
 * Browser Supabase client (publishable key only). Returns null when the
 * backend is not configured — callers must treat that as "UI preview mode".
 * Throws if the configuration is invalid (e.g. a secret key was supplied).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const result = readPublicEnv();
  if (result.status === "invalid")
    throw new Error(`Supabase configuration error: ${result.reason}`);
  cached =
    result.status === "configured"
      ? createClient(result.env.supabaseUrl, result.env.supabasePublishableKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        })
      : null;
  return cached;
}
