import { createClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

export interface Caller {
  id: string;
  /** Supabase anonymous user (guest, docs/platform/PLATFORM_SPEC.md). */
  isGuest: boolean;
}

/** Verifies the caller's JWT with Supabase Auth and returns the user id (guests included). */
export async function requireUser(request: Request): Promise<string> {
  return (await requireCaller(request)).id;
}

/** Account-only endpoints (Ranked, purchases, …): guests get 403 account_required. */
export async function requireAccount(request: Request): Promise<string> {
  const caller = await requireCaller(request);
  if (caller.isGuest) throw new HttpError(403, "account_required", "Create an account first");
  return caller.id;
}

/** Verifies the JWT with Supabase Auth (never trusts request bodies for identity). */
export async function requireCaller(request: Request): Promise<Caller> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "unauthenticated", "Missing bearer token");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("Supabase env not configured");
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error) throw new HttpError(401, "unauthenticated", "Invalid or expired session");
  return { id: data.user.id, isGuest: data.user.is_anonymous === true };
}
