/**
 * @aummon/game-engine — public entry point (Casual Discard Edition, ruleset "7").
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
export * as discard from "./discard/index.ts";
export * as sdk from "./sdk/index.ts";
export { edoBattle, parseEdoCommand, type EdoCommand } from "./edo-battle/module.ts";
export { GAME_MODULES, getGameModule, isGameId } from "./registry.ts";
export * as pokerGame from "./poker/index.ts";
export * as dummyGame from "./dummy/index.ts";
