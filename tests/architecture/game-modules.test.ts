/**
 * Game Center isolation (docs/platform/PLATFORM_SPEC.md §2–3):
 * each game folder in packages/game-engine/src imports only itself, the shared sdk / rng / version,
 * and (EDO Battle adapter only) its rules engine `discard`. No game imports another game.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const src = join(root, "packages/game-engine/src");
const IMPORT = /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']/g;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    return statSync(f).isDirectory() ? files(f) : n.endsWith(".ts") ? [f] : [];
  });
}

const SHARED = new Set(["sdk", "rng", "version.ts"]);
const EXTRA: Record<string, string[]> = { "edo-battle": ["discard"] };
const topOf = (f: string) => relative(src, f).split(sep)[0] ?? "";

describe("game module isolation", () => {
  const gameFiles = files(src).filter((f) => !["index.ts", "registry.ts"].includes(topOf(f)));
  it.each(gameFiles.map((f) => [relative(root, f), f]))("%s stays inside its game", (_l, file) => {
    const own = topOf(file);
    for (const m of readFileSync(file, "utf8").matchAll(IMPORT)) {
      const target = topOf(resolve(dirname(file), m[1] ?? ""));
      const ok =
        target === own ||
        SHARED.has(target) ||
        (EXTRA[own] ?? []).includes(target) ||
        (own === "sdk" && target === "rng");
      expect(ok, `${own} must not import ${target}`).toBe(true);
    }
  });
});

describe("Edge Functions authenticate callers", () => {
  // verify_jwt = false in supabase/config.toml: every handler must authenticate (auth.ts / admin.ts).
  const PUBLIC = new Set(["engine-health"]);
  const fnRoot = join(root, "supabase/functions");
  const fns = readdirSync(fnRoot).filter(
    (n) => !n.startsWith("_") && statSync(join(fnRoot, n)).isDirectory() && !PUBLIC.has(n),
  );
  it.each(fns)("%s checks the caller", (name) => {
    const code = readFileSync(join(fnRoot, name, "index.ts"), "utf8");
    expect(/requireUser\(|requireCaller\(|requireAccount\(|requireAdmin\(/.test(code)).toBe(true);
  });
});
