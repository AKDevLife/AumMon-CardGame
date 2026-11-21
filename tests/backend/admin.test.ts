/**
 * Admin RBAC (task 9.x) against local Supabase + Edge Functions.
 * Skipped unless VITE_SUPABASE_URL/KEY point to a running local stack.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SOUND_EVENT_IDS } from "../../supabase/functions/_shared/sound-schema.ts";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);
// Local stack only (default supabase CLI DB port); used to run the operator bootstrap SQL.
const dbUrl =
  process.env["SUPABASE_DB_URL"] ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/** RFC 6238 TOTP (SHA-1, 30 s, 6 digits) for the test authenticator. */
function totp(secretBase32: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secretBase32.replace(/=+$/, "").toUpperCase())
    bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const bytes = Buffer.from(bits.match(/.{8}/g)?.map((b) => parseInt(b, 2)) ?? []);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const h = createHmac("sha1", bytes).update(counter).digest();
  const off = (h[h.length - 1] ?? 0) & 0xf;
  const n = (h.readUInt32BE(off) & 0x7fffffff) % 1_000_000;
  return n.toString().padStart(6, "0");
}

async function user(name: string) {
  const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
  const email = `${name}${randomUUID().slice(0, 8)}@test.local`;
  const { data, error } = await client.auth.signUp({
    email,
    password: "secret123",
    options: { data: { display_name: name } },
  });
  if (error || !data.session) throw error ?? new Error("no session");
  const call = async (body: unknown, token?: string) => {
    const t = token ?? (await client.auth.getSession()).data.session?.access_token ?? "";
    const res = await fetch(`${url}/functions/v1/admin-api`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${t}`,
        apikey: key ?? "",
      },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  };
  return { client, email, id: data.user?.id ?? "", call };
}

async function verifyMfa(client: SupabaseClient) {
  const { data, error } = await client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `ci-${randomUUID()}`,
  });
  if (error) throw error;
  const verified = await client.auth.mfa.challengeAndVerify({
    factorId: data.id,
    code: totp(data.totp.secret),
  });
  if (verified.error) throw verified.error;
}

describe.runIf(run)("admin RBAC via Edge Functions", () => {
  const sql = postgres(dbUrl, { max: 1 });
  let player: Awaited<ReturnType<typeof user>>;
  let admin: Awaited<ReturnType<typeof user>>;

  beforeAll(async () => {
    [player, admin] = await Promise.all([user("Player"), user("Admin")]);
    await sql`select private.grant_admin(${admin.email}, 'ci-bootstrap')`;
  });
  afterAll(async () => {
    await sql.end();
  });

  it("rejects unauthenticated calls and unknown actions", async () => {
    const res = await fetch(`${url}/functions/v1/admin-api`, {
      method: "POST",
      headers: { apikey: key ?? "" },
      body: JSON.stringify({ action: "me" }),
    });
    expect(res.status).toBe(401);
    expect((await admin.call({ action: "drop_tables" })).status).toBe(400);
  });

  it("a normal player is forbidden everywhere", async () => {
    for (const action of ["me", "overview", "players", "logs.security"])
      expect((await player.call({ action })).body["error"]).toBe("forbidden");
    expect(
      (await player.call({ action: "player.set_disabled", userId: player.id, disabled: false }))
        .status,
    ).toBe(403);
  });

  it("a player cannot grant themselves admin", async () => {
    const insert = await player.client
      .schema("private")
      .from("admin_roles")
      .insert({ user_id: player.id, role: "super_admin", granted_by: "me" });
    expect(insert.error).not.toBeNull();
    const rpc = await player.client.rpc("grant_admin", {
      p_email: player.email,
      p_granted_by: "me",
    });
    expect(rpc.error).not.toBeNull();
    expect((await player.call({ action: "me" })).status).toBe(403);
  });

  it("admin without MFA can only probe `me`", async () => {
    const me = await admin.call({ action: "me" });
    expect(me.status).toBe(200);
    expect(me.body["aal"]).toBe("aal1");
    expect((await admin.call({ action: "overview" })).body["error"]).toBe("mfa_required");
  });

  it("admin with MFA reads the dashboard", async () => {
    await verifyMfa(admin.client);
    const me = await admin.call({ action: "me" });
    expect(me.body["aal"]).toBe("aal2");
    const overview = await admin.call({ action: "overview" });
    expect(overview.status).toBe(200);
    expect(JSON.stringify(overview.body)).not.toMatch(/internal_state|rng_state|service_role/);
    const cards = await admin.call({ action: "cards" });
    expect((cards.body["cards"] as unknown[]).length).toBe(24);
    expect((await admin.call({ action: "settings" })).body["env"]).toBe("development");
  });

  it("mutations are audited; self-disable and disabling admins are refused", async () => {
    expect(
      (await admin.call({ action: "player.set_disabled", userId: admin.id, disabled: true })).body[
        "error"
      ],
    ).toBe("cannot_disable_self");
    expect(
      (await admin.call({ action: "player.set_disabled", userId: player.id, disabled: true }))
        .status,
    ).toBe(200);
    const login = await createClient(url ?? "", key ?? "", {
      auth: { persistSession: false },
    }).auth.signInWithPassword({
      email: player.email,
      password: "secret123",
    });
    expect(login.error).not.toBeNull();
    expect(
      (await admin.call({ action: "player.set_disabled", userId: player.id, disabled: false }))
        .status,
    ).toBe(200);
    const logs = await admin.call({ action: "logs.security" });
    const actions = (logs.body["audit"] as { action: string; target_id: string }[])
      .filter((a) => a.target_id === player.id)
      .map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["player.disabled", "player.enabled"]));
    // Room cleanup: an open solo room is listed, can be closed (its game is abandoned), and is audited.
    const created = await fetch(`${url}/functions/v1/tcg-create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${(await player.client.auth.getSession()).data.session?.access_token ?? ""}`,
        apikey: key ?? "",
      },
      body: JSON.stringify({ mode: "solo" }),
    });
    expect(created.status).toBe(200);
    const rooms = (await admin.call({ action: "rooms" })).body as unknown as {
      id: string;
      match_status: string;
    }[];
    const open = rooms.find((r) => r.match_status === "active");
    if (!open) throw new Error("open room not listed");
    expect((await admin.call({ action: "room.close", roomId: open.id })).status).toBe(200);
    expect((await admin.call({ action: "room.close", roomId: open.id })).body["error"]).toBe(
      "not_closable",
    );
    expect((await admin.call({ action: "rooms.close_stale" })).status).toBe(200);
    expect((await player.call({ action: "rooms.close_stale" })).status).toBe(403);
    // Global sound settings: validated, admin-only, audited, readable by players.
    const sounds = Object.fromEntries(
      SOUND_EVENT_IDS.map((k) => [k, { preset: "pop", volume: 1, enabled: true }]),
    );
    expect(
      (
        await admin.call({
          action: "sounds.set",
          value: { ...sounds, attack: { preset: "laser", volume: 9, enabled: true } },
        })
      ).status,
    ).toBe(400);
    expect((await player.call({ action: "sounds.set", value: sounds })).status).toBe(403);
    expect((await admin.call({ action: "sounds.set", value: sounds })).status).toBe(200);
    const read = await player.client
      .from("game_settings")
      .select("value")
      .eq("key", "sounds")
      .single();
    expect(
      (read.data as { value: Record<string, { preset: string }> }).value["attack"]?.preset,
    ).toBe("pop");
    const sim = await admin.call({ action: "bots.simulate", games: 3 });
    expect(sim.body["games"]).toBe(3);
  }, 60_000);

  it("logout ends admin access", async () => {
    const token = (await admin.client.auth.getSession()).data.session?.access_token ?? "";
    await admin.client.auth.signOut();
    expect((await admin.call({ action: "overview" }, token)).status).toBe(401);
  });
});
