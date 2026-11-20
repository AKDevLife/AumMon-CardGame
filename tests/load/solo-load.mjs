#!/usr/bin/env node
/**
 * Task 7.6 — load test: N concurrent players each play a full Solo match
 * (1 bot) through the real Edge Functions, then delete their test account.
 *
 * Usage: SUPABASE_URL=… SUPABASE_PUBLISHABLE_KEY=… node tests/load/solo-load.mjs [players=20]
 * Run only against a Dev/Staging project — never production.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const players = Number(process.argv[2] ?? 20);
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required");

const timings = {};
let errors = 0;
const record = (fn, ms, ok) => {
  (timings[fn] ??= []).push(ms);
  if (!ok) errors++;
};

async function player(i) {
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `load${Date.now()}${i}${randomUUID().slice(0, 4)}@test.local`,
    password: "secret123",
    options: { data: { display_name: `Load ${i}` } },
  });
  if (error || !data.session) throw new Error(`signup failed: ${error?.message}`);
  const token = data.session.access_token;
  const call = async (fn, body) => {
    const t = performance.now();
    const res = await fetch(`${url}/functions/v1/${fn}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        apikey: key,
        ...(process.env.FUNCTION_REGION && { "x-region": process.env.FUNCTION_REGION }),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    record(fn, performance.now() - t, res.ok || res.status === 409);
    return { status: res.status, body: json };
  };

  const created = await call("tcg-create", { mode: "solo" });
  const matchId = created.body.matchId;
  let r = (await call("tcg-view", { matchId })).body;
  // Human plays the simplest legal line (attack > summon > mulligan > end turn) vs the server bot.
  const order = ["attack", "summon", "mulligan", "end_turn"];
  for (let step = 0; step < 300 && r.view?.status !== "finished"; step++) {
    const pick = order.map((t) => r.legal?.find((c) => c.type === t)).find(Boolean);
    if (!pick) {
      r = (await call("tcg-view", { matchId })).body;
      continue;
    }
    const command = pick.type === "mulligan" ? { type: "mulligan", instanceIds: [] } : pick;
    const res = await call("tcg-command", {
      matchId,
      expectedVersion: r.version,
      idempotencyKey: randomUUID(),
      command,
    });
    r = res.status === 200 ? res.body : (await call("tcg-view", { matchId })).body;
  }
  await call("account-delete", { confirm: "DELETE" }); // clean up test account
  return r.view?.status === "finished" ? "finished" : "ongoing";
}

const pct = (arr, p) =>
  Math.round(
    [...arr].sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))],
  );
const started = performance.now();
const results = await Promise.allSettled(Array.from({ length: players }, (_, i) => player(i)));
const finished = results.filter((r) => r.status === "fulfilled" && r.value !== "ongoing").length;
console.log(
  `players=${players} finished=${finished} failed=${results.filter((r) => r.status === "rejected").length} errors=${errors} total=${Math.round((performance.now() - started) / 1000)}s`,
);
for (const r of results)
  if (r.status === "rejected") console.log("  failure:", String(r.reason).slice(0, 120));
console.log("function            calls   p50   p95   p99 (ms, client-side)");
for (const [fn, arr] of Object.entries(timings)) {
  console.log(
    `${fn.padEnd(20)}${String(arr.length).padStart(5)} ${String(pct(arr, 50)).padStart(5)} ${String(pct(arr, 95)).padStart(5)} ${String(pct(arr, 99)).padStart(5)}`,
  );
}
