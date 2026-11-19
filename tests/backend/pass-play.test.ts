/** Pass & Play backend (tasks 5.1–5.2): local seats, server-controlled current seat, reveal-only hands. */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env["VITE_SUPABASE_URL"];
const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const run = url !== undefined && key !== undefined && /127\.0\.0\.1|localhost/.test(url);

interface Resp {
  mode: string;
  currentSeat: { playerId: string; displayName: string } | null;
  viewerPlayerId: string | null;
  deadline: string | null;
  view: {
    matchId: string;
    phase: string;
    round: number;
    version: number;
    players: { id: string; seat: number; displayName: string; status: string }[];
    myHand: { instanceId: string; definitionId: string }[];
    result: { status: string };
  };
}

async function owner() {
  const client = createClient(url ?? "", key ?? "", { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `pp${randomUUID().slice(0, 8)}@test.local`,
    password: "secret123",
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
    return { status: res.status, body: (await res.json()) as Resp & Record<string, unknown> };
  };
}

function command(r: Resp) {
  const card = r.view.myHand[0];
  if (!card) throw new Error("no hand revealed");
  const target = r.view.players.find(
    (p) => p.id !== r.currentSeat?.playerId && p.status === "alive",
  );
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

describe.runIf(run)("pass & play via Edge Functions", () => {
  let call: Awaited<ReturnType<typeof owner>>;
  let other: Awaited<ReturnType<typeof owner>>;
  let matchId = "";

  beforeAll(async () => {
    call = await owner();
    other = await owner();
  });

  it("validates seats", async () => {
    const dup = await call("rooms-create", {
      mode: "pass_play",
      seats: [
        { displayName: "A", characterId: "pyro_pup" },
        { displayName: "B", characterId: "pyro_pup" },
      ],
    });
    expect(dup.status).toBe(400);
    const badName = await call("rooms-create", {
      mode: "pass_play",
      seats: [
        { displayName: "<script>", characterId: "pyro_pup" },
        { displayName: "B", characterId: "breeze_kit" },
      ],
    });
    expect(badName.status).toBe(400);
  });

  it("starts with no hand shown until the handoff reveal", async () => {
    const room = await call("rooms-create", {
      mode: "pass_play",
      seats: [
        { displayName: "ผู้เล่น แอน", characterId: "pyro_pup" },
        { displayName: "Ben", characterId: "breeze_kit" },
      ],
    });
    const start = await call("matches-start", { roomId: room.body["roomId"] });
    expect(start.status).toBe(200);
    matchId = String(start.body["matchId"]);
    expect(start.body.mode).toBe("pass_play");
    expect(start.body.view.myHand).toEqual([]);
    expect(start.body.deadline).toBeNull(); // clarification Q11: no timeout
    expect(start.body.currentSeat?.displayName).toBe("ผู้เล่น แอน"); // Thai combining marks allowed
  });

  it("reveals only the current seat and acts for it", async () => {
    const shown = await call("matches-view", { matchId, reveal: true });
    expect(shown.body.viewerPlayerId).toBe(shown.body.currentSeat?.playerId);
    expect(shown.body.view.myHand.length).toBeGreaterThan(0);
    const after = await call("matches-submit-action", command(shown.body));
    expect(after.status).toBe(200);
    expect(after.body.view.myHand).toEqual([]); // next seat's hand is never auto-revealed
    expect(after.body.currentSeat?.displayName).toBe("Ben");
  });

  it("other accounts cannot see or act", async () => {
    expect((await other("matches-view", { matchId, reveal: true })).status).toBe(404);
  });

  it("plays to the end on one device", async () => {
    let r = (await call("matches-view", { matchId, reveal: true })).body;
    for (let i = 0; i < 300 && r.view.result.status === "ongoing"; i++) {
      if (r.view.phase === "turn_start") {
        expect((await call("matches-use-skill", { matchId })).status).toBe(200);
      } else {
        const res = await call("matches-submit-action", command(r));
        expect(res.status).toBe(200);
      }
      r = (await call("matches-view", { matchId, reveal: true })).body;
    }
    expect(r.view.result.status).not.toBe("ongoing");
  });
});
