/**
 * Backend integration: real Edge Functions + local Supabase (task 4.x).
 * Skipped unless VITE_SUPABASE_URL/KEY point to a running local stack.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);

interface View {
  matchId: string;
  phase: string;
  round: number;
  version: number;
  players: { id: string; hp: number; status: string; hasSubmitted: boolean; displayName: string }[];
  myHand: { instanceId: string; definitionId: string; type: string }[];
  events: { type: string; publicPayload: Record<string, unknown> }[];
  result: { status: string };
}

async function newUser() {
  const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
  const email = `solo${randomUUID().slice(0, 8)}@test.local`;
  const { data, error } = await client.auth.signUp({
    email,
    password: "secret123",
    options: { data: { display_name: "Solo" } },
  });
  if (error || !data.session) throw error ?? new Error("no session");
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
  return { client, call };
}

function pickCommand(view: View, me: string) {
  const card = view.myHand[0];
  if (!card) throw new Error("empty hand");
  const opponent = view.players.find((p) => p.id !== me && p.status === "alive");
  const needsTarget = ["attack", "chaos_disrupt", "chaos_redirect"].includes(card.definitionId);
  return {
    matchId: view.matchId,
    roundNumber: view.round,
    expectedVersion: view.version,
    cardInstanceId: card.instanceId,
    idempotencyKey: randomUUID(),
    ...(needsTarget && { targetPlayerId: opponent?.id }),
    ...(card.definitionId === "support" && { choice: "draw" }),
  };
}

describe.runIf(run)("solo match via Edge Functions", () => {
  let a: Awaited<ReturnType<typeof newUser>>;
  let b: Awaited<ReturnType<typeof newUser>>;
  let matchId = "";
  let me = "";
  let view: View;

  beforeAll(async () => {
    a = await newUser();
    b = await newUser();
  });

  it("rejects unauthenticated calls", async () => {
    const res = await fetch(`${url}/functions/v1/matches-view`, {
      method: "POST",
      body: "{}",
      headers: { apikey: key ?? "" },
    });
    expect(res.status).toBe(401);
  });

  it("creates a solo room and starts a match with server bots", async () => {
    const room = await a.call("rooms-create", {
      mode: "solo",
      characterId: "pyro_pup",
      botCount: 2,
    });
    expect(room.status).toBe(200);
    const start = await a.call("matches-start", { roomId: room.body["roomId"] });
    expect(start.status).toBe(200);
    matchId = String(start.body["matchId"]);
    view = start.body["view"] as View;
    expect(view.players).toHaveLength(3);
    expect(view.round).toBe(1);
    expect(view.myHand.length).toBeGreaterThanOrEqual(3);
    const { data: mineRows } = await a.client
      .from("match_players")
      .select("id")
      .eq("match_id", matchId);
    expect(mineRows).toHaveLength(3); // member reads public player state (RLS)
    const { data: foreign } = await b.client
      .from("match_players")
      .select("id")
      .eq("match_id", matchId);
    expect(foreign).toHaveLength(0); // non-member reads nothing
    const mine = view.players.find((p) => p.displayName === "Solo");
    me = mine?.id ?? "";
    expect(me).not.toBe("");
  });

  it("other users cannot view the match", async () => {
    const res = await b.call("matches-view", { matchId });
    expect(res.status).toBe(404);
  });

  it("rejects server-computed fields and foreign cards", async () => {
    const forged = await a.call("matches-submit-action", { ...pickCommand(view, me), hp: 99 });
    expect(forged.status).toBe(400);
    const foreign = await a.call("matches-submit-action", {
      ...pickCommand(view, me),
      cardInstanceId: randomUUID(),
    });
    expect(foreign.status).toBe(409);
    expect(foreign.body["error"]).toBe("card_not_in_hand");
  });

  it("is idempotent: same key + same payload → same result; different payload → 409", async () => {
    if (view.phase === "turn_start") {
      view = (await a.call("matches-use-skill", { matchId })).body["view"] as View;
    }
    const cmd = pickCommand(view, me);
    const first = await a.call("matches-submit-action", cmd);
    expect(first.body).toMatchObject({ status: "accepted" });
    const again = await a.call("matches-submit-action", cmd);
    expect(again.status).toBe(200);
    expect(again.body["status"]).toBe("accepted");
    const conflict = await a.call("matches-submit-action", { ...cmd, choice: "heal" });
    expect(conflict.status).toBe(409);
    view = first.body["view"] as View;
    expect(view.events.some((e) => e.type === "actions.revealed")).toBe(true);
  });

  it("concurrent submits for one seat: exactly one is accepted", async () => {
    if (view.phase === "turn_start")
      view = (await a.call("matches-use-skill", { matchId })).body["view"] as View;
    if (view.result.status !== "ongoing") return;
    const results = await Promise.all([
      a.call("matches-submit-action", pickCommand(view, me)),
      a.call("matches-submit-action", pickCommand(view, me)),
      a.call("matches-submit-action", {
        ...pickCommand(view, me),
        expectedVersion: view.version - 1,
      }),
    ]);
    const accepted = results.filter((r) => r.status === 200);
    expect(accepted).toHaveLength(1);
    for (const r of results.filter((x) => x.status !== 200)) {
      expect([
        "already_submitted",
        "version_conflict",
        "wrong_round",
        "wrong_phase", // the accepted submit may have ended the match
        "card_not_in_hand",
      ]).toContain(r.body["error"]);
    }
    view = accepted[0]?.body["view"] as View;
  });

  it("plays to the end; hidden information never leaks", async () => {
    for (let i = 0; i < 200 && view.result.status === "ongoing"; i++) {
      if (view.phase === "turn_start") {
        view = (await a.call("matches-use-skill", { matchId })).body["view"] as View;
        continue;
      }
      const meAlive = view.players.find((p) => p.id === me)?.status === "alive";
      if (!meAlive) {
        // eliminated: bots keep playing; viewing advances nothing more for us, stop here
        break;
      }
      const res = await a.call("matches-submit-action", pickCommand(view, me));
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      view = res.body["view"] as View;
      const raw = JSON.stringify(res.body);
      expect(raw).not.toContain("rng");
      expect(raw).not.toContain("deck");
      expect(raw).not.toContain("skillState");
    }
    expect(["win", "draw", "ongoing"]).toContain(view.result.status);
  });
});
