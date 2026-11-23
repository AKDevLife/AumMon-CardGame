import { edoBattle } from "./edo-battle/module.ts";
import type { AnyGameModule, GameId } from "./sdk/module.ts";

/** Server game registry: game_id → module. A game is playable only if listed here AND enabled in public.games. */
export const GAME_MODULES: Partial<Record<GameId, AnyGameModule>> = {
  edo_battle: edoBattle,
};

export const isGameId = (v: unknown): v is GameId =>
  v === "edo_battle" || v === "dummy" || v === "poker";

export function getGameModule(id: string): AnyGameModule {
  const m = isGameId(id) ? GAME_MODULES[id] : undefined;
  if (!m) throw new Error(`unknown game ${id}`);
  return m;
}
