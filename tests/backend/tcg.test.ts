/**
 * Ruleset 2 backend (task 8.10): real Edge Functions + local Supabase.
 * Skipped unless VITE_SUPABASE_URL/KEY point to a running local stack.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);

type Legal = { type: string } & Record<string, unknown>;
interface Tcg {
  matchId: string;
  version: number;
  seat: 0 | 1 | null;
  actingSeat: 0 | 1 | null;
  deadline: string | null;
  legal: Legal[];
  view: {
    status: string;
    myHand: { instanceId: string; cardId: string }[];
    players: { hp: number; handCount: number }[];
    result: unknown;
  };
}

async function newUser() {
  const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `tcg${randomUUID().slice(0, 8)}@test.local`,
    password: "secret123",
    options: { data: { display_name: "Tcg" } },
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

const send = (
  call: Awaited<ReturnType<typeof newUser>>,
  v: Tcg,
  command: Legal,
  idem = randomUUID(),
) =>
  call("tcg-command", {
    matchId: v.matchId,
    expectedVersion: v.version,
    idempotencyKey: idem,
    command,
  });

describe.runIf(run)("ruleset 2 matches via Edge Functions", () => {
  let a: Awaited<ReturnType<typeof newUser>>;
  let b: Awaited<ReturnType<typeof newUser>>;

  beforeAll(async () => {
    a = await newUser();
    b = await newUser();
  });

  it("solo: plays a whole match against the server bot", async () => {
    const created = await a("tcg-create", { mode: "solo" });
    expect(created.status).toBe(200);
    const matchId = created.body["matchId"] as string;
    let v = (await a("tcg-view", { matchId })).body as unknown as Tcg;
    expect(v.seat).toBe(0);
    expect(v.view.myHand).toHaveLength(5);
    expect(v.deadline).not.toBeNull();
    expect(JSON.stringify(v)).not.toContain('"deck"');

    expect((await b("tcg-view", { matchId })).status).toBe(404);
    expect(
      (
        await b("tcg-command", {
          matchId,
          expectedVersion: v.version,
          idempotencyKey: randomUUID(),
          command: { type: "end_turn" },
        })
      ).status,
    ).toBe(404);

    const idem = randomUUID();
    const first = await send(a, v, { type: "mulligan", instanceIds: [] }, idem);
    expect(first.status).toBe(200);
    const replay = await send(a, v, { type: "mulligan", instanceIds: [] }, idem);
    expect(replay.body["version"]).toBe(first.body["version"]);
    expect((await send(a, v, { type: "end_turn" })).body["error"]).toBe("stale_version");
    v = first.body as unknown as Tcg;

    for (let i = 0; i < 1500 && v.view.status !== "finished"; i++) {
      const pick =
        v.legal.find((c) => c.type === "attack") ??
        v.legal.find((c) => c.type === "summon") ??
        v.legal.find((c) => c.type === "end_turn");
      if (!pick) {
        // Bot turns are paced on the server: wait for its next step, then refresh.
        await new Promise((r) => setTimeout(r, 750));
        v = (await a("tcg-view", { matchId })).body as unknown as Tcg;
        continue;
      }
      const res = await send(a, v, pick);
      expect(res.status).toBe(200);
      v = res.body as unknown as Tcg;
    }
    expect(v.view.status).toBe("finished");
    expect(v.view.result).not.toBeNull();
  }, 600_000);

  it("rejects illegal intents with engine error codes", async () => {
    const matchId = (await a("tcg-create", { mode: "solo" })).body["matchId"] as string;
    let v = (await a("tcg-view", { matchId })).body as unknown as Tcg;
    v = (await send(a, v, { type: "mulligan", instanceIds: [] })).body as unknown as Tcg;
    const bad = await send(a, v, { type: "attack", attackerId: "nope", target: "player" });
    expect(bad.status).toBe(409);
    expect((await send(a, v, { type: "hack_hp" })).status).toBe(400);
    expect(
      (
        await a("tcg-command", {
          matchId,
          expectedVersion: v.version,
          idempotencyKey: randomUUID(),
          command: { type: "end_turn" },
          hp: 99,
        })
      ).status,
    ).toBe(400);
  });

  it("pass & play: hand hidden until reveal; owner acts for the current seat", async () => {
    const created = await a("tcg-create", { mode: "pass_play", names: ["Ann", "Ben"] });
    const matchId = created.body["matchId"] as string;
    const hidden = (await a("tcg-view", { matchId })).body as unknown as Tcg;
    expect(hidden.seat).toBeNull();
    expect(hidden.view.myHand).toHaveLength(0);
    expect(hidden.deadline).toBeNull();
    const shown = (await a("tcg-view", { matchId, reveal: true })).body as unknown as Tcg;
    expect(shown.seat).toBe(0);
    expect(shown.view.myHand).toHaveLength(5);
    const next = (await send(a, shown, { type: "mulligan", instanceIds: [] }))
      .body as unknown as Tcg;
    expect(next.actingSeat).toBe(1);
    expect(next.seat).toBeNull(); // seat changed → hidden until the next handoff
    let v = (await a("tcg-view", { matchId, reveal: true })).body as unknown as Tcg;
    v = (await send(a, v, { type: "mulligan", instanceIds: [] })).body as unknown as Tcg;
    const first = v.actingSeat;
    v = (await a("tcg-view", { matchId, reveal: true })).body as unknown as Tcg;
    const summon = v.legal.find((c) => c.type === "summon");
    if (summon) {
      const after = (await send(a, v, summon)).body as unknown as Tcg;
      expect(after.actingSeat).toBe(first);
      expect(after.seat).toBe(first); // same seat keeps acting → hand stays visible
    }
  });

  it("forfeit ends the match", async () => {
    const matchId = (await a("tcg-create", { mode: "solo" })).body["matchId"] as string;
    const v = (await a("tcg-view", { matchId })).body as unknown as Tcg;
    const res = (await send(a, { ...v, version: v.version - 1 }, { type: "forfeit" }))
      .body as unknown as Tcg; // stale view still forfeits
    expect(res.view.status).toBe("finished");
    expect(res.view.result).toEqual({ winner: 1 });
  });
});
