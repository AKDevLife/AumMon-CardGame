#!/usr/bin/env node
/**
 * Task 7.7 — post-deploy smoke test (read-only, creates no data).
 * Usage: node scripts/smoke.mjs <site-url> <supabase-url>
 * Exit code 1 on any failed check.
 */
const [site, supabase] = process.argv.slice(2);
if (!site || !supabase) {
  console.error("Usage: node scripts/smoke.mjs <site-url> <supabase-url>");
  process.exit(2);
}
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(["PASS", name]);
  } catch (error) {
    results.push(["FAIL", `${name}: ${error instanceof Error ? error.message : String(error)}`]);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

let html = "";
let headers;
await check("site responds 200", async () => {
  const res = await fetch(site, { redirect: "manual" });
  assert(res.status === 200, `status ${res.status} (protected or down?)`);
  headers = res.headers;
  html = await res.text();
});
await check("security headers", async () => {
  for (const h of [
    "content-security-policy",
    "strict-transport-security",
    "x-frame-options",
    "x-content-type-options",
  ]) {
    assert(headers?.get(h), `missing ${h}`);
  }
});
await check("bundle has public Supabase config and no secret key", async () => {
  const src = /src="(\/assets\/[^"]+\.js)"/.exec(html)?.[1];
  assert(src, "no JS bundle found");
  const js = await (await fetch(new URL(src, site))).text();
  assert(js.includes(new URL(supabase).host), "Supabase URL not in bundle (Vercel env missing?)");
  assert(!/sb_secret_[A-Za-z0-9_-]{10,}/.test(js), "SECRET KEY FOUND IN BUNDLE");
});
await check("SPA deep link works", async () => {
  const res = await fetch(new URL("/play/solo", site));
  assert(res.status === 200, `status ${res.status}`);
});
await check("engine-health", async () => {
  const body = await (await fetch(`${supabase}/functions/v1/engine-health`)).json();
  // EDO Battle ruleset "13" + every Game Center engine loaded.
  assert(
    body.rulesetVersion === "13" &&
      body.games?.edo_battle === "13" &&
      body.games?.dummy === "5" &&
      body.games?.poker === "1",
    JSON.stringify(body),
  );
});
await check("API rejects unauthenticated commands", async () => {
  const res = await fetch(`${supabase}/functions/v1/game-view`, { method: "POST", body: "{}" });
  assert(res.status === 401, `status ${res.status}`);
});
await check("CORS allows the site origin", async () => {
  const res = await fetch(`${supabase}/functions/v1/game-view`, {
    method: "OPTIONS",
    headers: { Origin: new URL(site).origin, "Access-Control-Request-Method": "POST" },
  });
  assert(
    res.headers.get("access-control-allow-origin") === new URL(site).origin,
    "origin not allowed",
  );
});
await check("private schema not exposed", async () => {
  const res = await fetch(`${supabase}/rest/v1/match_runtime?select=*`, {
    headers: { "Accept-Profile": "private" },
  });
  assert(res.status >= 400, `status ${res.status}`);
});

for (const [status, name] of results) console.log(`${status}  ${name}`);
process.exit(results.some(([s]) => s === "FAIL") ? 1 : 0);
