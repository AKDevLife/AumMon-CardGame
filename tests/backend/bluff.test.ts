/**
 * v2 BLUFF + guests: real Edge Functions + local Supabase (skipped without a local stack).
 * docs/platform/PLATFORM_SPEC.md — guest → room → join by code → round with concurrent locks.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);
const sql = postgres(
  process.env["SUPABASE_DB_URL"] ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  { max: 2 },
);

interface View {
  matchId: string;
  version: number;
  seat: number | null;
  pending: number[];
  deadline: string | null;
  view: {
    gameId: string;
    players: string[];
    phase: string;
    round: number;
    item: { prompt: string; options: string[] } | null;
    locked: boolean[];
    myLock: unknown;
    reveal: { locks: { answer: number | null }[]; points: { total: number }[] } | null;
    scores: number[];
  };
}

async function guest(name: string) {
  const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInAnonymously({
    options: { data: { display_name: name } },
  });
  if (error || !data.session || !data.user) throw error ?? new Error("no session");
  const token = data.session.access_token;
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
  return { id: data.user.id, isAnonymous: data.user.is_anonymous, client, call };
}
type Guest = Awaited<ReturnType<typeof guest>>;

const view = async (g: Guest, matchId: string) =>
  (await g.call("game-view", { matchId })).body as unknown as View;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitPhase(g: Guest, matchId: string, phase: string): Promise<View> {
  for (let i = 0; i < 40; i++) {
    const v = await view(g, matchId);
    if (v.view.phase === phase) return v;
    await sleep(500);
  }
  throw new Error(`phase ${phase} not reached`);
}
const cmd = (g: Guest, v: View, command: Record<string, unknown>) =>
  g.call("game-command", {
    matchId: v.matchId,
    expectedVersion: v.version,
    idempotencyKey: randomUUID(),
    command,
  });

describe.runIf(run)("BLUFF with guests via Edge Functions", () => {
  let a: Guest;
  let b: Guest;
  let c: Guest;
  let matchId = "";

  beforeAll(async () => {
    // Local test DB only: approve part of the seed pack so a room can start.
    await sql`update private.content_items set status = 'approved'
      where id in (select id from private.content_items where game_id = 'bluff' and not ('group' = any(tags))
                   order by id limit 12)`;
    [a, b, c] = await Promise.all([guest("ออม"), guest("บอส"), guest("ฟ้า")]);
  });
  afterAll(async () => {
    await sql.end();
  });

  it("guests are anonymous users with a profile nickname and no table access to content", async () => {
    expect(a.isAnonymous).toBe(true);
    const { data } = await a.client.from("profiles").select("display_name").eq("id", a.id).single();
    expect(data?.display_name).toBe("ออม");
    const { error } = await a.client
      .schema("private" as never)
      .from("content_items")
      .select("id");
    expect(error).not.toBeNull();
  });

  it("guests cannot use admin; BLUFF solo with bots starts", async () => {
    expect((await a.call("admin-api", { action: "me" })).body["error"]).toBe("account_required");
    const solo = await a.call("game-create", { mode: "solo", bots: 2, gameId: "bluff" });
    expect(solo.status, JSON.stringify(solo.body)).toBe(200);
    await a.call("game-leave", { matchId: solo.body["matchId"] });
  });

  it("validates room settings", async () => {
    const bad = await a.call("rooms-create", {
      mode: "online",
      gameId: "bluff",
      settings: { humor: 3 },
    });
    expect(bad.status).toBe(400);
  });

  it(
    "a guest room with 3 players plays a round: hidden locks, concurrent locks, reveal",
    { timeout: 60_000 },
    async () => {
      const created = await a.call("rooms-create", {
        mode: "online",
        gameId: "bluff",
        maxPlayers: 3,
        settings: { humor: 2, slow: false, group: false },
      });
      expect(created.status).toBe(200);
      const roomId = String(created.body["roomId"]);
      const joinCode = String(created.body["joinCode"]);
      for (const g of [b, c]) {
        expect((await g.call("rooms-join", { joinCode })).status).toBe(200);
        expect((await g.call("rooms-ready", { roomId, ready: true })).status).toBe(200);
      }
      const start = await a.call("game-start", { roomId });
      expect(start.status, JSON.stringify(start.body)).toBe(200);
      matchId = String(start.body["matchId"]);

      const read = await view(a, matchId);
      expect(read.view.gameId).toBe("bluff");
      expect(read.view.phase).toBe("read");
      expect(read.view.item?.options).toHaveLength(4);
      expect(read.pending).toEqual([]);

      let v = await waitPhase(a, matchId, "claim");
      expect(v.pending).toEqual([0, 1, 2]);
      expect((await cmd(a, v, { type: "claim", option: 1 })).status).toBe(200);
      expect((await cmd(a, await view(a, matchId), { type: "pass" })).body["error"]).toBe(
        "already_claimed",
      );
      await cmd(b, await view(b, matchId), { type: "taunt", taunt: 0 });
      await cmd(c, await view(c, matchId), { type: "pass" });

      v = await waitPhase(a, matchId, "lock");
      const lockA = await cmd(a, v, { type: "lock", answer: 0, prediction: 2, wager: 1 });
      expect(lockA.status).toBe(200);
      const vb = await view(b, matchId);
      expect(vb.view.locked.filter(Boolean)).toHaveLength(1);
      expect(vb.view.myLock).toBeNull();
      expect(JSON.stringify(vb)).not.toContain('"prediction":2');
      // Both remaining players lock at the same moment with the same (stale) version.
      const vc = await view(c, matchId);
      const [rb, rc] = await Promise.all([
        cmd(b, vb, { type: "lock", answer: 2, prediction: 2, wager: 0 }),
        cmd(c, vc, { type: "lock", answer: 2, prediction: 2, wager: 2 }),
      ]);
      expect([rb.status, rc.status]).toEqual([200, 200]);

      const reveal = await view(a, matchId);
      expect(reveal.view.phase).toBe("reveal");
      expect(reveal.view.reveal?.locks.map((l) => l.answer)).toEqual([0, 2, 2]);
      // a: predicted C, Top for a = C → +2 +1 = 3; b/c: Top for them = A,C tie → hit, crowd +1
      expect(reveal.view.scores).toEqual([3, 3, 5]);
    },
  );

  it(
    "one guest can start a 4-seat room: empty seats become bots that decide at once",
    { timeout: 60_000 },
    async () => {
      const solo = await guest("เดี่ยว");
      const created = await solo.call("rooms-create", {
        mode: "online",
        gameId: "bluff",
        maxPlayers: 4,
      });
      const roomId = String(created.body["roomId"]);
      const start = await solo.call("game-start", { roomId });
      expect(start.status, JSON.stringify(start.body)).toBe(200);
      const id = String(start.body["matchId"]);
      const v = await waitPhase(solo, id, "claim");
      expect(v.view.players).toHaveLength(4);
      expect(v.pending).toEqual([0]); // bots already claimed / passed
      expect((v as unknown as { names: string[] }).names.slice(1)).toEqual([
        "Bot 1",
        "Bot 2",
        "Bot 3",
      ]);
      await cmd(solo, v, { type: "pass" });
      const lock = await waitPhase(solo, id, "lock");
      expect(lock.pending).toEqual([0]);
      await cmd(solo, lock, { type: "lock", answer: 1, prediction: 1, wager: 0 });
      const reveal = await view(solo, id);
      expect(reveal.view.phase).toBe("reveal");
      expect(reveal.view.reveal?.locks.every((l) => l.answer !== null)).toBe(true);
      await solo.call("game-leave", { matchId: id });
    },
  );

  it("only seated players can see or act", async () => {
    const outsider = await guest("แขก");
    expect((await outsider.call("game-view", { matchId })).status).toBe(404);
    const v = await view(a, matchId);
    expect((await cmd(a, v, { type: "lock", answer: 0, prediction: 0, wager: 0 })).status).toBe(
      409,
    );
  });

  it("player report: 3 different players hide an approved item", async () => {
    const [item] = await sql<{ id: string }[]>`
      select id from private.content_items where status = 'approved' order by id desc limit 1`;
    const id = item?.id ?? "";
    for (const g of [a, b])
      expect((await g.call("content-report", { contentId: id, matchId })).body["hidden"]).toBe(
        false,
      );
    expect((await c.call("content-report", { contentId: id, matchId })).body["hidden"]).toBe(true);
    const [row] = await sql<
      { status: string }[]
    >`select status from private.content_items where id = ${id}`;
    expect(row?.status).toBe("in_review");
  });
});
