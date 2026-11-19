/**
 * @aummon/game-engine — public entry point.
 *
 * Pure TypeScript: no React, Supabase, UI, HTTP, database, Node.js or Deno
 * APIs. Relative imports use explicit `.ts` extensions so the same sources
 * can be loaded by Vite, Vitest, Node.js and Deno (Supabase Edge Functions).
 */
export { ENGINE_VERSION, RULESET_VERSION } from "./version.ts";
export type * from "./domain/types.ts";
export { compareTurnOrder } from "./domain/state.ts";
export { createSeededRandom, type RngState, type SeededRandom } from "./rng/seeded-random.ts";
export { RULESET_V1, STANDARD_DECK_V1 } from "./rules/v1/constants.ts";
export { countCards } from "./rules/v1/deck.ts";
export {
  initializeMatch,
  SetupError,
  type InitializeMatchInput,
  type SeatInput,
} from "./rules/v1/setup.ts";
export {
  getLegalActions,
  validateAction,
  type LegalAction,
  type ValidationErrorCode,
  type ValidationResult,
} from "./rules/v1/actions.ts";
export {
  aquaEligible,
  forfeit,
  pendingPlayers,
  PhaseError,
  startRound,
  submitAction,
  useTurnStartSkill,
  type SkillCommand,
} from "./rules/v1/round.ts";
export { resolveRound } from "./rules/v1/resolve.ts";
export {
  CHARACTER_EFFECT_HOOKS,
  CharacterConfigError,
  assertCharacterSupported,
} from "./characters/registry.ts";
export {
  buildPlayerView,
  type HandCardView,
  type PlayerGameView,
  type PublicPlayerView,
} from "./views/player-view.ts";
export { normalBot, type BotDecisionContext, type BotStrategy } from "./bots/strategy.ts";
export { autoSubmit, botContext, chooseBotAction } from "./bots/auto.ts";
