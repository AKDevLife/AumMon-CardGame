/** Guards drift between supabase/seed.sql and the ruleset 2 engine data (task 8.9). */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CARD_DEFINITIONS_V2,
  EVOLUTION_RECIPES_V2,
  FUSION_RECIPES_V2,
  STARTER_DECK_V2,
} from "../../packages/game-engine/src/rules/v2/index.ts";

const seed = readFileSync("supabase/seed.sql", "utf8");
const arr = (a: readonly string[]) => `'{${a.join(",")}}'`;

describe("seed.sql matches engine ruleset 2 data", () => {
  it.each(CARD_DEFINITIONS_V2.map((c) => [c.cardId, c] as const))("card %s", (_id, c) => {
    const row = `('${c.cardId}', '${c.name.replace(/'/g, "''")}', '${c.cardType}', '', '${JSON.stringify(
      {
        effects: c.effects,
        compatibility: c.compatibility,
      },
    )}', '2', '${c.rarity}', ${c.stage}, ${c.cost}, ${c.atk}, ${c.hp}, ${arr(c.traits)}, ${arr(c.keywords)}, ${c.slotCost}, ${c.deckable})`;
    expect(seed).toContain(row);
  });

  it("recipes", () => {
    for (const r of EVOLUTION_RECIPES_V2)
      expect(seed).toContain(
        `('${r.recipeId}', '${r.sourceCardId}', '${r.targetCardId}', ${r.requiredStage}, '${r.requiredTrait}', ${r.cost}, '${r.recipeVersion}')`,
      );
    for (const r of FUSION_RECIPES_V2)
      expect(seed).toContain(
        `('${r.recipeId}', '${r.parentCardIds[0]}', '${r.parentCardIds[1]}', '${r.resultCardId}', ${r.cost}, ${arr(r.inheritedKeywords)}, '${r.recipeVersion}')`,
      );
  });

  it("starter deck", () => {
    for (const [id, n] of Object.entries(STARTER_DECK_V2))
      expect(seed).toContain(`('starter_v2', 1, '${id}', ${n})`);
  });
});
