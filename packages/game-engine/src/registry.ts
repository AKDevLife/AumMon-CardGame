import { bluff } from "./bluff/module.ts";
import { edoBattle } from "./edo-battle/module.ts";
import type { AnyGameModule, GameId } from "./sdk/module.ts";

/**
 * Server game registry: game_id → module. A game is playable only if listed here AND enabled in public.games.
 * Dummy and Poker were retired by the owner (Product Direction v2, 2026-11-25); their rows stay as history.
 */
export const GAME_MODULES: Partial<Record<GameId, AnyGameModule>> = {
  edo_battle: edoBattle,
  bluff,
};

export const isGameId = (v: unknown): v is GameId => v === "edo_battle" || v === "bluff";

export function getGameModule(id: string): AnyGameModule {
  const m = isGameId(id) ? GAME_MODULES[id] : undefined;
  if (!m) throw new Error(`unknown game ${id}`);
  return m;
}
