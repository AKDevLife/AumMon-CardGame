/**
 * @aummon/game-engine — public entry point (ruleset 3: Everyday Objects Battle, aummon_game_spec.md v4.0).
 *
 * Pure TypeScript: no React, Supabase, UI, HTTP, database, Node.js or Deno
 * APIs. Relative imports use explicit `.ts` extensions so the same sources
 * can be loaded by Vite, Vitest, Node.js and Deno (Supabase Edge Functions).
 */
export { ENGINE_VERSION, RULESET_VERSION } from "./version.ts";
export {
  createSeededRandom,
  type RandomSource,
  type RngState,
  type SeededRandom,
} from "./rng/seeded-random.ts";
export * as v3 from "./rules/v3/index.ts";
