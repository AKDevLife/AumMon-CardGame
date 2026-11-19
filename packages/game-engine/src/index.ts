/**
 * @aummon/game-engine — public entry point.
 *
 * Pure TypeScript: no React, Supabase, UI, HTTP, database, Node.js or Deno
 * APIs. Relative imports use explicit `.ts` extensions so the same sources
 * can be loaded by Vite, Vitest, Node.js and Deno (Supabase Edge Functions).
 */
export { ENGINE_VERSION, RULESET_VERSION } from "./version.ts";
export type {
  CardDefinition,
  CardInstanceId,
  CardType,
  CharacterDefinition,
  CharacterHook,
  GameEvent,
  GamePhase,
  GameState,
  PlayerId,
  PlayerState,
  PlayerStatus,
  RandomSource,
  SubmitActionCommand,
  Transition,
} from "./domain/types.ts";
export type { HandCardView, PlayerGameView, PublicPlayerView } from "./views/player-view.ts";
