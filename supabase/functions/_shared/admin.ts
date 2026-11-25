/**
 * Developer admin (task 9.x): every admin request is authorized here, server-side.
 * - Valid Supabase session (JWT verified by Auth), role from private.admin_roles.
 * - MFA required (JWT aal = "aal2") for everything except the `me` probe.
 * - Mutations are written to the append-only private.admin_audit_log.
 * The client never holds a privileged key; hiding UI is not a security boundary.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { db } from "./db.ts";
import { HttpError } from "./http.ts";
import type { Tx } from "./store.ts";

import { parseAppEnv, type AppEnv } from "./env.ts";

export type { AppEnv };
export const appEnv = (): AppEnv => parseAppEnv(Deno.env.get("AUMMON_ENV"));

export interface AdminContext {
  userId: string;
  role: "super_admin";
  aal: string;
}

function jwtClaim(token: string, key: string): unknown {
  try {
    const payload = token.split(".")[1] ?? "";
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(json) as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

/** Authenticates and authorizes an admin. `allowAal1` only for the `me` probe. */
export async function requireAdmin(request: Request, allowAal1 = false): Promise<AdminContext> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "unauthenticated", "Missing bearer token");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("Supabase env not configured");
  const client = createClient(url, anon, { auth: { persistSession: false } });
  // getUser validates the token with Auth (signature, expiry, revoked sessions).
  const { data, error } = await client.auth.getUser(token);
  if (error) throw new HttpError(401, "unauthenticated", "Invalid or expired session");
  // Guests can never be admins (defence in depth; roles are granted to accounts only).
  if (data.user.is_anonymous === true)
    throw new HttpError(403, "account_required", "Account required");
  const [row] = await db()<{ role: "super_admin" }[]>`
    select role from private.admin_roles where user_id = ${data.user.id}`;
  if (!row) throw new HttpError(403, "forbidden", "Admin access required");
  const claim = jwtClaim(token, "aal");
  const aal = typeof claim === "string" ? claim : "aal1";
  if (aal !== "aal2" && !allowAal1) throw new HttpError(403, "mfa_required", "Verify MFA first");
  return { userId: data.user.id, role: row.role, aal };
}

export async function audit(
  tx: Tx,
  admin: AdminContext,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  await tx`
    insert into private.admin_audit_log (actor_user_id, action, target_type, target_id, details)
    values (${admin.userId}, ${action}, ${targetType}, ${targetId}, ${tx.json(details as never)})`;
}

/** Supabase Auth admin API (service role stays inside the Edge Runtime). */
export async function authAdmin(path: string, method: string, body?: unknown): Promise<void> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase admin env not configured");
  const res = await fetch(`${url}/auth/v1/admin/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`auth admin ${method} ${path} failed: ${res.status}`);
}
