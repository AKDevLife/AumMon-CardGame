/**
 * Architecture guard for packages/game-engine (blueprint section 2 and 5.1).
 *
 * ESLint already blocks forbidden imports; this test is a second, lint-
 * independent safety net that runs in CI with the unit tests.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ENGINE_VERSION } from "../../packages/game-engine/src/index.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const engineRoot = join(repoRoot, "packages/game-engine");

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.(ts|tsx|mts|cts|js|mjs|cjs|jsx)$/.test(name) ? [full] : [];
  });
}

const IMPORT_PATTERN =
  /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s*["']([^"']+)["']|require\s*\(\s*["']([^"']+)["']\s*\)/g;

function importSpecifiers(source: string): string[] {
  return [...source.matchAll(IMPORT_PATTERN)]
    .map((m) => m[1] ?? m[2] ?? m[3] ?? m[4])
    .filter((s): s is string => s !== undefined);
}

const engineSrcFiles = listSourceFiles(join(engineRoot, "src"));

describe("packages/game-engine isolation", () => {
  it("has source files to check", () => {
    expect(engineSrcFiles.length).toBeGreaterThan(0);
  });

  it("declares no runtime or peer dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(engineRoot, "package.json"), "utf8")) as Record<
      string,
      unknown
    >;
    for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
      expect(Object.keys((pkg[field] as Record<string, string> | undefined) ?? {})).toEqual([]);
    }
  });

  it("keeps ENGINE_VERSION in sync with package.json", () => {
    const pkg = JSON.parse(readFileSync(join(engineRoot, "package.json"), "utf8")) as {
      version: string;
    };
    expect(ENGINE_VERSION).toBe(pkg.version);
  });

  it.each(engineSrcFiles.map((f) => [relative(repoRoot, f), f]))(
    "%s imports only relative files inside the engine",
    (_label, file) => {
      const source = readFileSync(file, "utf8");
      for (const spec of importSpecifiers(source)) {
        expect(spec.startsWith("./") || spec.startsWith("../"), `bare import "${spec}"`).toBe(true);
        const target = resolve(dirname(file), spec);
        expect(
          target.startsWith(join(engineRoot, "src") + sep),
          `"${spec}" escapes packages/game-engine/src`,
        ).toBe(true);
      }
    },
  );
});
