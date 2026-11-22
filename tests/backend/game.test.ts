/**
 * Casual Discard Edition backend: real Edge Functions + local Supabase.
 * Skipped unless VITE_SUPABASE_URL/KEY point to a running local stack.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);

interface Game {
  matchId: string;
  version: number;
  seat: number | null;
  acting: number | null;
  deadline: string | null;
  botActing: boolean;
  names: string[];
  view: {
    status: string;
    myHand: { id: string; cardId: string }[];
    players: { handCount: number }[];
    playable: string[];
    canDraw: boolean;
    canReact: boolean;
    winner: number | null;
  };
}

async function newUser() {
  const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `game${randomUUID().slice(0, 8)}@test.local`,
    password: "secret123",
    options: { data: { display_name: "Gamer" } },
  });
  if (error || !data.session) throw error ?? new Error("no session");
  const token = data.session.access_token;
  return async (fn: string, body: unknown) => {
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
}

type Call = Awaited<ReturnType<typeof newUser>>;
const send = (call: Call, v: Game, command: Record<string, unknown>, idem = randomUUID()) =>
  call("game-command", {
    matchId: v.matchId,
    expectedVersion: v.version,
    idempotencyKey: idem,
    command,
  });

describe.runIf(run)("discard matches via Edge Functions", () => {
  let a: Call;
  let b: Call;

  beforeAll(async () => {
    a = await newUser();
    b = await newUser();
  });

  it("solo with 3 bots: hands are private; playing / drawing works; bots move", async () => {
    const created = await a("game-create", { mode: "solo", bots: 3 });
    expect(created.status).toBe(200);
    const matchId = created.body["matchId"] as string;
    let v = (await a("game-view", { matchId })).body as unknown as Game;
    expect(v.seat).toBe(0);
    expect(v.view.players).toHaveLength(4);
    expect(v.view.myHand).toHaveLength(7);
    expect(JSON.stringify(v)).not.toContain('"drawPile"');
    expect((await b("game-view", { matchId })).status).toBe(404);

    for (let i = 0; i < 400 && v.view.status !== "finished"; i++) {
      if (!v.view.canDraw && !v.view.canReact) {
        await new Promise((r) => setTimeout(r, 750));
        v = (await a("game-view", { matchId })).body as unknown as Game;
        continue;
      }
      const command = v.view.canReact
        ? { type: "react", useUmbrella: true }
        : v.view.playable[0]
          ? { type: "play", card: v.view.playable[0], useAbility: false }
          : { type: "draw" };
      const res = await send(a, v, command);
      expect(res.status).toBe(200);
      v = res.body as unknown as Game;
      if (i > 40) break;
    }
    expect(["active", "finished"]).toContain(v.view.status);
  }, 300_000);

  it("rejects illegal intents with engine error codes", async () => {
    const matchId = (await a("game-create", { mode: "solo", bots: 1 })).body["matchId"] as string;
    const v = (await a("game-view", { matchId })).body as unknown as Game;
    const bad = await send(a, v, { type: "play", card: "nope", useAbility: false });
    expect([403, 409]).toContain(bad.status);
    expect((await send(a, v, { type: "cheat" })).status).toBe(400);
    expect((await a("game-create", { mode: "solo", bots: 9 })).status).toBe(400);
  });

  it("pass & play mode is gone", async () => {
    expect((await a("game-create", { mode: "pass_play", names: ["Ann", "Ben"] })).status).toBe(400);
  });

  it("leaving an online-style solo match ends it", async () => {
    const matchId = (await a("game-create", { mode: "solo", bots: 2 })).body["matchId"] as string;
    expect((await a("game-leave", { matchId })).status).toBe(200);
    expect((await b("game-leave", { matchId })).status).toBe(404);
  });
});
