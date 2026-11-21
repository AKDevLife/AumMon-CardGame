/** Ruleset 4 (Everyday Objects Battle — aummon_game_spec.md v5.0). */
export type * from "./types.ts";
export { CARD_DEFINITIONS_V5, getCardDefinition } from "./cards.ts";
export {
  ABILITY_BUDGET_ALLOWANCE,
  POWER_BUDGET_V5,
  RULESET_V5,
  STARTER_DECK_V5,
} from "./constants.ts";
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
export { unitAtk, unitHp, unitKeywords, unitMaxHp } from "./stats.ts";
export { getPlayerView, type PlayerView, type PublicPlayer } from "./view.ts";
export { chooseBotCommand } from "./bot.ts";
