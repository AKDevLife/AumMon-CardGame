/** Ruleset 2 constants (aummon_game_spec.md §1.3, §4.1–4.2, §4.10, §4.12). */
export const RULESET_V2 = {
  players: 2,
  playerHp: 20,
  deckSize: 30,
  initialHand: 5,
  maxCopies: 3,
  /** Owner decision 2026-11-20 (clarification R2-3): overdraw goes to Discard. */
  maxHand: 10,
  maxUnits: 3,
  maxEquipmentSlots: 2,
  startSpark: 1,
  maxSpark: 8,
  minCost: 1,
  maxFusionInheritedKeywords: 2,
  turnTimeoutMs: 90_000,
} as const;

/** Power budget guideline: cost → [min, max] of ATK + HP (§4.12). */
export const POWER_BUDGET_V2: Readonly<Record<number, readonly [number, number]>> = {
  1: [4, 6],
  2: [6, 8],
  3: [8, 10],
  4: [11, 13],
  5: [13, 15],
};

/** Provisional Starter Deck, 30 cards (§1.5). */
export const STARTER_DECK_V2: Readonly<Record<string, number>> = {
  U001_RUBBER_DUCKLING: 2,
  U002_TIN_CAN_GUARDIAN: 2,
  U003_PAPER_GLIDER: 2,
  U004_POCKET_FLASHLIGHT: 2,
  U005_MINI_SKATEBOARD: 2,
  U006_THERMOS_GOLEM: 2,
  U007_BATTERY_BUDDY: 2,
  U008_WINDUP_ROBOT: 2,
  A001: 3,
  A002: 2,
  A003: 2,
  E001: 2,
  E002: 2,
  E003: 3,
};
