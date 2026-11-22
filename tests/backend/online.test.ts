/** Online multiplayer backend (Phase 6) against local Supabase + Edge Functions + Realtime. */
import {
  createClient,
  REALTIME_SUBSCRIBE_STATES,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);

interface GameView {
  version: number;
  seat: number | null;
  view: { status: string; myHand: { id: string }[] };
}

async function user(name: string) {
  const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `${name}${randomUUID().slice(0, 8)}@test.local`,
    password: "secret123",
    options: { data: { display_name: name } },
  });
  if (error || !data.session) throw error ?? new Error("no session");
  const token = data.session.access_token;
  await client.realtime.setAuth(token);
  const call = async (fn: string, body: unknown) => {
    const res = await fetch(`${url}/functions/v1/${fn}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        apikey: key ?? "",
      },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: (await res.json()) as Record<string, unknown> };
  };
  return { client, call };
}

function listen(client: SupabaseClient, matchId: string) {
  const received: unknown[] = [];
  let markReady: () => void = () => undefined;
  // SUBSCRIBED fires before the Postgres Changes replication is ready; wait for the
  // realtime "system" confirmation (or a short fallback) before generating changes.
  const ready = new Promise<void>((resolve) => {
    markReady = resolve;
    setTimeout(resolve, 8000);
  });
  const channel = client
    .channel(`match-${matchId}-${randomUUID()}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
      (p) => {
        received.push(p.new);
      },
    )
    .on("system", {}, (payload: { extension?: string; status?: string }) => {
      if (payload.extension === "postgres_changes" && payload.status === "ok") markReady();
    });
  channel.subscribe();
  return { received, ready, channel };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe.runIf(run)("online multiplayer via Edge Functions", () => {
  let a: Awaited<ReturnType<typeof user>>;
  let b: Awaited<ReturnType<typeof user>>;
  let c: Awaited<ReturnType<typeof user>>;
  let roomId = "";
  let code = "";
  let matchId = "";

  beforeAll(async () => {
    [a, b, c] = await Promise.all([user("Ann"), user("Ben"), user("Cat")]);
  });

  it("owner creates a 2-player lobby and gets a join code (stored hashed)", async () => {
    const res = await a.call("rooms-create", { mode: "online", maxPlayers: 2 });
    expect(res.status).toBe(200);
    roomId = String(res.body["roomId"]);
    code = String(res.body["joinCode"]);
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
    const { data } = await a.client
      .from("game_rooms")
      .select("join_code_hash, max_players, ruleset_version")
      .eq("id", roomId)
      .single();
    const room = data as { join_code_hash: string; max_players: number; ruleset_version: string };
    expect(room.join_code_hash).not.toContain(code);
    expect([room.max_players, room.ruleset_version]).toEqual([2, "8"]);
  });

  it("joining validates code and capacity", async () => {
    expect((await b.call("rooms-join", { joinCode: "AAAAAAAA" })).status).toBe(404);
    expect((await b.call("rooms-join", { joinCode: code.toLowerCase() })).status).toBe(200);
    expect((await c.call("rooms-join", { joinCode: code })).body["error"]).toBe("room_full");
  });

  it("rate-limits join-code guessing", async () => {
    const tries = await Promise.all(
      Array.from({ length: 12 }, () => c.call("rooms-join", { joinCode: "ZZZZZZZZ" })),
    );
    expect(tries.some((t) => t.status === 429)).toBe(true);
  });

  it("start requires everyone ready; only the owner can start", async () => {
    expect((await a.call("game-start", { roomId })).body["error"]).toBe("not_ready");
    expect((await b.call("rooms-ready", { roomId, ready: true })).status).toBe(200);
    expect((await b.call("game-start", { roomId })).status).toBe(404);
    const start = await a.call("game-start", { roomId });
    expect(start.status).toBe(200);
    matchId = String(start.body["matchId"]);
  });

  it("each player sees only their own hand; outsiders see nothing", async () => {
    const va = (await a.call("game-view", { matchId })).body as unknown as GameView;
    const vb = (await b.call("game-view", { matchId })).body as unknown as GameView;
    expect(va.seat).not.toBe(vb.seat);
    for (const h of vb.view.myHand) expect(JSON.stringify(va)).not.toContain(`"${h.id}"`);
    expect((await c.call("game-view", { matchId })).status).toBe(404);
    const { data } = await c.client.from("matches").select("id").eq("id", matchId);
    expect(data).toEqual([]);
  });

  it("members get realtime notifications; non-members do not", async () => {
    const la = listen(a.client, matchId);
    const lc = listen(c.client, matchId);
    await Promise.all([la.ready, lc.ready]);
    const va = (await a.call("game-view", { matchId })).body as unknown as GameView;
    const vb = (await b.call("game-view", { matchId })).body as unknown as GameView;
    // Both try to act at once: the row lock serializes them; only the current player may draw.
    const draw = (v: GameView) => ({
      matchId,
      expectedVersion: v.version,
      idempotencyKey: randomUUID(),
      command: { type: "draw" },
    });
    const [ra, rb] = await Promise.all([
      a.call("game-command", draw(va)),
      b.call("game-command", draw(vb)),
    ]);
    const statuses = [ra.status, rb.status].sort();
    expect(statuses[0]).toBe(200);
    expect([403, 409]).toContain(statuses[1]);
    const after = (await a.call("game-view", { matchId })).body as unknown as GameView;
    expect(after.view.status).toBe("active");
    for (let i = 0; i < 40 && la.received.length === 0; i++) await wait(250);
    expect(la.received.length).toBeGreaterThan(0);
    expect(JSON.stringify(la.received)).not.toMatch(/internal_state|rng_state|"deck"|"hand"/);
    expect(lc.received).toEqual([]);
    await a.client.removeChannel(la.channel);
    await c.client.removeChannel(lc.channel);
  }, 30_000);

  it("private match channel (Presence/Broadcast) admits members only", async () => {
    const join = (client: SupabaseClient) =>
      new Promise<string>((resolve) => {
        const ch = client.channel(`match:${matchId}`, { config: { private: true } });
        ch.subscribe((status) => {
          if (status !== REALTIME_SUBSCRIBE_STATES.CLOSED) {
            resolve(status);
            void client.removeChannel(ch);
          }
        });
        setTimeout(() => {
          resolve("TIMEOUT");
        }, 8000);
      });
    const [member, outsider] = await Promise.all([join(a.client), join(c.client)]);
    expect(member).toBe(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
    expect(outsider).not.toBe(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
  }, 20_000);

  it("leaving hands the seat to a bot; the match goes on", async () => {
    expect((await b.call("game-leave", { matchId })).status).toBe(200);
    const after = (await a.call("game-view", { matchId })).body as unknown as GameView;
    expect(after.view.status).toBe("active");
    expect((await b.call("game-view", { matchId })).status).toBe(404);
  });
});
