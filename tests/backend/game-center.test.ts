/**
 * Game Center backend (GC4/GC6/GC4.4): Dummy, Poker and Quick Match through the real Edge Functions.
 * Skipped unless VITE_SUPABASE_URL/KEY point to a running local stack.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);

type Body = Record<string, unknown>;

async function newUser() {
  const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `gc${randomUUID().slice(0, 8)}@test.local`,
    password: "secret123",
    options: { data: { display_name: "Center" } },
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
    return { status: res.status, body: (await res.json()) as Body };
  };
}
type Call = Awaited<ReturnType<typeof newUser>>;

const view = async (call: Call, matchId: string) => (await call("game-view", { matchId })).body;
const command = (call: Call, g: Body, cmd: Body) =>
  call("game-command", {
    matchId: g["matchId"],
    expectedVersion: g["version"],
    idempotencyKey: randomUUID(),
    command: cmd,
  });

describe.runIf(run)("Game Center games via Edge Functions", () => {
  let a: Call;
  let b: Call;
  beforeAll(async () => {
    a = await newUser();
    b = await newUser();
  });

  it("solo Dummy: hidden hands, draw + discard, invalid meld rejected", async () => {
    const created = await a("game-create", { mode: "solo", bots: 1, gameId: "dummy" });
    expect(created.status).toBe(200);
    const matchId = created.body["matchId"] as string;
    let g = await view(a, matchId);
    expect(g["gameId"]).toBe("dummy");
    const v = g["view"] as { myHand: string[]; players: { handCount: number }[]; seat: number };
    expect(v.myHand).toHaveLength(11);
    expect(JSON.stringify(g)).not.toContain('"hand"');
    // Wait for our turn (bot may start).
    for (let i = 0; i < 20 && g["acting"] !== g["seat"]; i++) {
      await new Promise((r) => setTimeout(r, 800));
      g = await view(a, matchId);
    }
    expect(g["acting"]).toBe(g["seat"]);
    const bad = await command(a, g, { type: "meld", cards: ["As", "Kd", "2h"] });
    expect(bad.status).toBe(409);
    const drew = await command(a, g, { type: "draw" });
    expect(drew.status).toBe(200);
    const hand = (drew.body["view"] as { myHand: string[] }).myHand;
    const out = await command(a, drew.body, { type: "discard", card: hand[0] });
    expect(out.status).toBe(200);
    expect(b).toBeDefined();
    const stranger = await b("game-view", { matchId });
    expect(stranger.status).toBe(404);
  });

  it("solo Poker: own hole cards only, illegal raise rejected, fold accepted", async () => {
    const created = await a("game-create", { mode: "solo", bots: 2, gameId: "poker" });
    expect(created.status).toBe(200);
    const matchId = created.body["matchId"] as string;
    let g = await view(a, matchId);
    for (let i = 0; i < 20 && g["acting"] !== g["seat"]; i++) {
      await new Promise((r) => setTimeout(r, 800));
      g = await view(a, matchId);
    }
    const v = g["view"] as { myCards: string[]; legal: { minTo: number } | null };
    expect(v.myCards).toHaveLength(2);
    expect(JSON.stringify(g)).not.toContain('"hole"');
    if (v.legal) {
      const bad = await command(a, g, { type: "raise", to: v.legal.minTo - 1 });
      expect(bad.status).toBe(409);
      const fold = await command(a, g, { type: "fold" });
      expect(fold.status).toBe(200);
    }
  });

  it("rejects unknown games and out-of-range seats", async () => {
    expect((await a("game-create", { mode: "solo", bots: 1, gameId: "chess" })).status).toBe(404);
    expect((await a("game-create", { mode: "solo", bots: 5, gameId: "dummy" })).status).toBe(400);
  });

  it("Quick Match pairs two players into one match", async () => {
    const one = await a("matchmaking", { action: "join", gameId: "dummy", players: 2 });
    expect(one.body["status"]).toBe("waiting");
    const two = await b("matchmaking", { action: "join", gameId: "dummy", players: 2 });
    expect(two.body["status"]).toBe("matched");
    const again = await a("matchmaking", { action: "status" });
    expect(again.body["status"]).toBe("matched");
    expect(again.body["matchId"]).toBe(two.body["matchId"]);
    const g = await view(a, two.body["matchId"] as string);
    expect(g["mode"]).toBe("quick_match");
    expect((g["names"] as string[]).length).toBe(2);
  });
});
