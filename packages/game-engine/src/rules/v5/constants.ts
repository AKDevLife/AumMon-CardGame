/** Ruleset 4 constants (aummon_game_spec.md v5.0 §4, §5.5, §6). */
export const RULESET_V5 = {
  version: "5",
  players: 2,
  playerHp: 20,
  deckSize: 30,
  initialHand: 5,
  maxCopies: 3,
  maxHand: 10,
  maxUnits: 3,
  startSpark: 1,
  maxSpark: 8,
  minCost: 1,
  /** Safety limits (spec §5.15): effects resolved per command. */
  maxEffectsPerCommand: 100,
  turnTimeoutMs: 90_000,
} as const;

/** Power budget: cost → [min, max] of ATK + HP; Objects with abilities may go up to 3 below min. */
export const POWER_BUDGET_V5: Readonly<Record<number, readonly [number, number]>> = {
  1: [4, 6],
  2: [6, 8],
  3: [8, 10],
  4: [11, 13],
  5: [13, 15],
  6: [15, 17],
};
export const ABILITY_BUDGET_ALLOWANCE = 3;

/** Starter Deck v5 (30): all 24 × 1 plus a second O01, O03, O08, O13, O19, O23. */
export const STARTER_DECK_V5: Readonly<Record<string, number>> = Object.fromEntries(
  Array.from({ length: 24 }, (_, i) => {
    const id = `O${String(i + 1).padStart(2, "0")}`;
    return [id, ["O01", "O03", "O08", "O13", "O19", "O23"].includes(id) ? 2 : 1];
  }),
);
