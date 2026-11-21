import type { CardDefinition } from "./types.ts";
import { ABILITY_BUDGET_ALLOWANCE, POWER_BUDGET_V5, RULESET_V5 } from "./constants.ts";

/** Hard errors make card data unusable; budget flags are review warnings (spec §6.1). */
export interface DataReport {
  readonly errors: readonly string[];
  readonly budgetFlags: readonly string[];
}

export function validateCardData(
  cards: readonly CardDefinition[],
  deck: Readonly<Record<string, number>>,
): DataReport {
  const errors: string[] = [];
  const budgetFlags: string[] = [];
  const byId = new Map<string, CardDefinition>();

  for (const c of cards) {
    if (byId.has(c.cardId)) errors.push(`duplicate card ${c.cardId}`);
    byId.set(c.cardId, c);
    if (c.cost < RULESET_V5.minCost || c.cost > RULESET_V5.maxSpark)
      errors.push(`${c.cardId}: cost ${c.cost} out of range`);
    if (c.atk < 0 || c.hp < 1) errors.push(`${c.cardId}: invalid ATK/HP`);
    if (c.keywords.includes("guard") && c.keywords.includes("flying"))
      errors.push(`${c.cardId}: Guard and Flying cannot be combined`);
    if (!c.name || !c.flavor) errors.push(`${c.cardId}: missing text`);
    for (const a of [c.passive, c.active])
      if (a && (!a.name || !a.text)) errors.push(`${c.cardId}: ability without name/text`);
    if (c.passive?.kind === "static" && c.passive.amount === 0)
      errors.push(`${c.cardId}: static passive without effect`);
    const budget = POWER_BUDGET_V5[c.cost];
    const total = c.atk + c.hp;
    const hasAbility = c.passive !== null || c.active !== null;
    const min = budget ? budget[0] - (hasAbility ? ABILITY_BUDGET_ALLOWANCE : 0) : 0;
    if (budget && (total < min || total > budget[1]))
      budgetFlags.push(`${c.cardId}: ATK+HP ${total} outside ${min}–${budget[1]}`);
  }

  let total = 0;
  for (const [id, copies] of Object.entries(deck)) {
    total += copies;
    if (!byId.has(id)) errors.push(`deck: unknown card ${id}`);
    if (copies < 1 || copies > RULESET_V5.maxCopies)
      errors.push(`deck: ${id} has ${copies} copies`);
  }
  if (total !== RULESET_V5.deckSize)
    errors.push(`deck: ${total} cards, expected ${RULESET_V5.deckSize}`);

  return { errors, budgetFlags };
}
