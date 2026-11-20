import type { CardDefinition, EvolutionRecipe, FusionRecipe } from "./types.ts";
import { POWER_BUDGET_V2, RULESET_V2 } from "./constants.ts";

/** Hard errors make card data unusable; budget flags are review warnings (§4.12). */
export interface DataReport {
  readonly errors: readonly string[];
  readonly budgetFlags: readonly string[];
}

export function validateCardData(
  cards: readonly CardDefinition[],
  evolutions: readonly EvolutionRecipe[],
  fusions: readonly FusionRecipe[],
  deck: Readonly<Record<string, number>>,
): DataReport {
  const errors: string[] = [];
  const budgetFlags: string[] = [];
  const byId = new Map<string, CardDefinition>();

  for (const c of cards) {
    if (byId.has(c.cardId)) errors.push(`duplicate card ${c.cardId}`);
    byId.set(c.cardId, c);
    if (c.cost < RULESET_V2.minCost || c.cost > RULESET_V2.maxSpark)
      errors.push(`${c.cardId}: cost ${c.cost} out of range`);
    if (c.cardType === "unit") {
      if (c.atk < 0 || c.hp < 1) errors.push(`${c.cardId}: invalid ATK/HP`);
      const budget = POWER_BUDGET_V2[c.cost];
      const total = c.atk + c.hp;
      if (c.deckable && budget && (total < budget[0] || total > budget[1]))
        budgetFlags.push(`${c.cardId}: ATK+HP ${total} outside ${budget[0]}–${budget[1]}`);
    }
    if (c.cardType === "equipment" && (c.slotCost < 1 || c.slotCost > RULESET_V2.maxEquipmentSlots))
      errors.push(`${c.cardId}: invalid slot cost`);
  }

  const unit = (id: string, what: string): CardDefinition | undefined => {
    const c = byId.get(id);
    if (c?.cardType !== "unit") errors.push(`${what}: unknown unit ${id}`);
    return c;
  };

  const evolved = new Set<string>();
  for (const r of evolutions) {
    const src = unit(r.sourceCardId, r.recipeId);
    const dst = unit(r.targetCardId, r.recipeId);
    if (!src || !dst) continue;
    if (src.stage !== r.requiredStage) errors.push(`${r.recipeId}: source stage mismatch`);
    if (dst.stage <= src.stage) errors.push(`${r.recipeId}: target stage must increase`);
    if (!src.traits.includes(r.requiredTrait)) errors.push(`${r.recipeId}: source lacks trait`);
    if (dst.deckable) errors.push(`${r.recipeId}: target must not be deckable`);
    if (evolved.has(r.sourceCardId)) errors.push(`${r.recipeId}: duplicate source`);
    evolved.add(r.sourceCardId);
  }

  for (const r of fusions) {
    const parents = r.parentCardIds.map((id) => unit(id, r.recipeId));
    const result = unit(r.resultCardId, r.recipeId);
    if (r.parentCardIds[0] === r.parentCardIds[1]) errors.push(`${r.recipeId}: same parents`);
    if (result?.deckable) errors.push(`${r.recipeId}: result must not be deckable`);
    if (r.inheritedKeywords.length > RULESET_V2.maxFusionInheritedKeywords)
      errors.push(`${r.recipeId}: too many inherited keywords`);
    for (const k of r.inheritedKeywords)
      if (!parents.some((p) => p?.keywords.includes(k)))
        errors.push(`${r.recipeId}: no parent has ${k}`);
  }

  let total = 0;
  for (const [id, copies] of Object.entries(deck)) {
    total += copies;
    const c = byId.get(id);
    if (!c) errors.push(`deck: unknown card ${id}`);
    else if (!c.deckable) errors.push(`deck: ${id} is not deckable`);
    if (copies < 1 || copies > RULESET_V2.maxCopies)
      errors.push(`deck: ${id} has ${copies} copies`);
  }
  if (total !== RULESET_V2.deckSize)
    errors.push(`deck: ${total} cards, expected ${RULESET_V2.deckSize}`);

  return { errors, budgetFlags };
}
