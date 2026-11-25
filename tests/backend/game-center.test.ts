/**
 * Game Center backend (GC4.4): Quick Match and game availability through the real Edge Functions.
 * Dummy and Poker were retired (Product Direction v2, 2026-11-25).
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
describe.runIf(run)("Game Center games via Edge Functions", () => {
  let a: Call;
  let b: Call;
  beforeAll(async () => {
    a = await newUser();
    b = await newUser();
  });

  it("rejects unknown games and out-of-range seats", async () => {
    expect((await a("game-create", { mode: "solo", bots: 1, gameId: "chess" })).status).toBe(404);
    // Retired games are disabled in public.games: not playable any more.
    expect((await a("game-create", { mode: "solo", bots: 1, gameId: "dummy" })).status).not.toBe(
      200,
    );
    expect((await a("game-create", { mode: "solo", bots: 1, gameId: "poker" })).status).not.toBe(
      200,
    );
    expect((await a("game-create", { mode: "solo", bots: 8, gameId: "edo_battle" })).status).toBe(
      400,
    );
  });

  it("Quick Match pairs two players into one match", async () => {
    const one = await a("matchmaking", { action: "join", gameId: "edo_battle", players: 2 });
    expect(one.body["status"]).toBe("waiting");
    const two = await b("matchmaking", { action: "join", gameId: "edo_battle", players: 2 });
    expect(two.body["status"]).toBe("matched");
    const again = await a("matchmaking", { action: "status" });
    expect(again.body["status"]).toBe("matched");
    expect(again.body["matchId"]).toBe(two.body["matchId"]);
    const g = await view(a, two.body["matchId"] as string);
    expect(g["mode"]).toBe("quick_match");
    expect((g["names"] as string[]).length).toBe(2);
  });
});
