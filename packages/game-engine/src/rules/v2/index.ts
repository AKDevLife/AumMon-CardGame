/** Ruleset 2 (1v1 TCG, aummon_game_spec.md v3.0) — card data. */
export type * from "./types.ts";
export { CARD_DEFINITIONS_V2, getCardDefinition } from "./cards.ts";
export { EVOLUTION_RECIPES_V2, FUSION_RECIPES_V2 } from "./recipes.ts";
export { POWER_BUDGET_V2, RULESET_V2, STARTER_DECK_V2 } from "./constants.ts";
export { validateCardData, type DataReport } from "./validate.ts";
export type * from "./state.ts";
export {
  applyCommand,
  CommandError,
  getLegalCommands,
  initializeMatch,
  type Command,
  type CommandErrorCode,
  type LegalCommand,
  type MatchInput,
  type Transition,
} from "./match.ts";
export { canEquip, unitAtk, unitHp, unitKeywords, unitMaxHp, usedSlots } from "./stats.ts";
export { getPlayerView, type PlayerView, type PublicPlayer } from "./view.ts";
export { chooseBotCommand } from "./bot.ts";
