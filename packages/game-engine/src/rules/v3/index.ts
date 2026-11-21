/** Ruleset 3 (Everyday Objects Battle — aummon_game_spec.md v4.0). */
export type * from "./types.ts";
export { CARD_DEFINITIONS_V3, getCardDefinition } from "./cards.ts";
export {
  ABILITY_BUDGET_ALLOWANCE,
  POWER_BUDGET_V3,
  RULESET_V3,
  STARTER_DECK_V3,
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
