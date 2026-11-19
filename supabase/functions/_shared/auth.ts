import { createClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

/** Verifies the caller's JWT with Supabase Auth and returns the user id. */
export async function requireUser(request: Request): Promise<string> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "unauthenticated", "Missing bearer token");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("Supabase env not configured");
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error) throw new HttpError(401, "unauthenticated", "Invalid or expired session");
  return data.user.id;
}
