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

interface Resp {
  viewerPlayerId: string | null;
  deadline: string | null;
  view: {
    matchId: string;
    phase: string;
    round: number;
    version: number;
    players: { id: string; status: string; hasSubmitted: boolean }[];
    myHand: { instanceId: string; definitionId: string }[];
    events: { type: string }[];
    result: { status: string; winnerId?: string };
  };
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
    return { status: res.status, body: (await res.json()) as Resp & Record<string, unknown> };
  };
  return { client, call };
}

function command(r: Resp) {
  const card = r.view.myHand[0];
  if (!card) throw new Error("empty hand");
  const target = r.view.players.find((p) => p.id !== r.viewerPlayerId && p.status === "alive");
  return {
    matchId: r.view.matchId,
    roundNumber: r.view.round,
    expectedVersion: r.view.version,
    cardInstanceId: card.instanceId,
    idempotencyKey: randomUUID(),
    ...(["attack", "chaos_disrupt", "chaos_redirect"].includes(card.definitionId) && {
      targetPlayerId: target?.id,
    }),
    ...(card.definitionId === "support" && { choice: "draw" }),
  };
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

  it("owner creates a lobby and gets a join code (stored hashed)", async () => {
    const res = await a.call("rooms-create", {
      mode: "online",
      characterId: "pyro_pup",
      maxPlayers: 2,
    });
    expect(res.status).toBe(200);
    roomId = String(res.body["roomId"]);
    code = String(res.body["joinCode"]);
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
    const { data } = await a.client
      .from("game_rooms")
      .select("join_code_hash")
      .eq("id", roomId)
      .single();
    expect((data as { join_code_hash: string }).join_code_hash).not.toContain(code);
  });

  it("joining validates code, character and capacity", async () => {
    expect(
      (await b.call("rooms-join", { joinCode: "AAAAAAAA", characterId: "breeze_kit" })).status,
    ).toBe(404);
    expect(
      (await b.call("rooms-join", { joinCode: code, characterId: "pyro_pup" })).body["error"],
    ).toBe("character_taken");
    expect(
      (await b.call("rooms-join", { joinCode: code.toLowerCase(), characterId: "breeze_kit" }))
        .status,
    ).toBe(200);
    expect(
      (await c.call("rooms-join", { joinCode: code, characterId: "aqua_otter" })).body["error"],
    ).toBe("room_full");
  });

  it("rate-limits join-code guessing", async () => {
    const tries = await Promise.all(
      Array.from({ length: 12 }, () =>
        c.call("rooms-join", { joinCode: "ZZZZZZZZ", characterId: "aqua_otter" }),
      ),
    );
    expect(tries.some((t) => t.status === 429)).toBe(true);
  });

  it("start requires everyone ready; only the owner can start", async () => {
    expect((await a.call("matches-start", { roomId })).body["error"]).toBe("not_ready");
    expect((await b.call("rooms-ready", { roomId, ready: true })).status).toBe(200);
    expect((await b.call("matches-start", { roomId })).status).toBe(404);
    const start = await a.call("matches-start", { roomId });
    expect(start.status).toBe(200);
    matchId = String(start.body["matchId"]);
  });

  it("each player sees only their own hand; outsiders see nothing", async () => {
    const va = (await a.call("matches-view", { matchId })).body;
    const vb = (await b.call("matches-view", { matchId })).body;
    expect(va.viewerPlayerId).not.toBe(vb.viewerPlayerId);
    const bCards = vb.view.myHand.map((h) => h.instanceId);
    for (const id of bCards) expect(JSON.stringify(va)).not.toContain(id);
    expect((await c.call("matches-view", { matchId })).status).toBe(404);
    const { data } = await c.client.from("matches").select("id").eq("id", matchId);
    expect(data).toEqual([]);
  });

  it("members get realtime notifications; non-members do not", async () => {
    const la = listen(a.client, matchId);
    const lc = listen(c.client, matchId);
    await Promise.all([la.ready, lc.ready]);
    let va = (await a.call("matches-view", { matchId })).body;
    let vb = (await b.call("matches-view", { matchId })).body;
    if (va.view.phase === "turn_start") {
      await (va.viewerPlayerId && va.view.players.length ? a : b).call("matches-use-skill", {
        matchId,
      });
      await b.call("matches-use-skill", { matchId });
      va = (await a.call("matches-view", { matchId })).body;
      vb = (await b.call("matches-view", { matchId })).body;
    }
    // Simultaneous submits from both players: exactly one resolve for this round.
    const round = va.view.round;
    const [ra, rb] = await Promise.all([
      a.call("matches-submit-action", command(va)),
      b.call("matches-submit-action", command(vb)),
    ]);
    expect([ra.status, rb.status]).toEqual([200, 200]);
    const after = (await a.call("matches-view", { matchId })).body;
    const resolved = after.view.events.filter((e) => e.type === "round.ended");
    expect(resolved.length).toBeLessThanOrEqual(2); // events cover current + previous round only
    expect(after.view.round === round + 1 || after.view.result.status !== "ongoing").toBe(true);
    for (let i = 0; i < 40 && la.received.length === 0; i++) await wait(250);
    expect(la.received.length).toBeGreaterThan(0);
    expect(JSON.stringify(la.received)).not.toMatch(/internal_state|rng_state|"deck"|"hands"/);
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

  it("forfeit ends a 2-player match for the other player", async () => {
    const r = await b.call("matches-forfeit", { matchId });
    expect(r.status).toBe(200);
    const final = (await a.call("matches-resume", { matchId })).body;
    expect(final.view.result.status).toBe("win");
    expect(final.view.result.winnerId).toBe(final.viewerPlayerId);
  });
});
