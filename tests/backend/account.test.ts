/** Task 7.4 — account deletion via Edge Function (local Supabase). */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);

describe.runIf(run)("account deletion", () => {
  it("forfeits active matches, deletes the account and blocks login", async () => {
    const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
    const email = `del${randomUUID().slice(0, 8)}@test.local`;
    const { data } = await client.auth.signUp({ email, password: "secret123" });
    const token = data.session?.access_token ?? "";
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
    const room = await call("rooms-create", { mode: "solo", characterId: "pyro_pup", botCount: 1 });
    const start = await call("matches-start", { roomId: room.body["roomId"] });
    expect(start.status).toBe(200);

    expect((await call("account-delete", {})).status).toBe(400); // explicit confirmation required
    expect((await call("account-delete", { confirm: "DELETE" })).status).toBe(200);

    const login = await client.auth.signInWithPassword({ email, password: "secret123" });
    expect(login.error).not.toBeNull();
    expect((await call("matches-view", { matchId: start.body["matchId"] })).status).toBe(401);
  }, 30_000);
});
