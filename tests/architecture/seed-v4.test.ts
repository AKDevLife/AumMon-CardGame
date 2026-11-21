/** Guards drift between the ruleset 4 migration and the engine card data (task 11.1). */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CARD_DEFINITIONS_V4,
  STARTER_DECK_V4,
} from "../../packages/game-engine/src/rules/v4/index.ts";

const sql = readFileSync("supabase/migrations/20261121000300_trait_rework.sql", "utf8");
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const arr = (a: readonly string[]) => `'{${a.join(",")}}'`;

describe("ruleset 4 migration matches engine data", () => {
  it.each(CARD_DEFINITIONS_V4.map((c) => [c.cardId, c] as const))("card %s", (_id, c) => {
    const spec = JSON.stringify({
      nameEn: c.nameEn,
      archetype: c.archetype,
      passive: c.passive,
      active: c.active,
    });
    expect(sql).toContain(
      `(${q(c.cardId)}, ${q(c.name)}, 'unit', ${q(c.flavor)}, ${q(spec)}, '4', '${c.rarity}', 0, ${c.cost}, ${c.atk}, ${c.hp}, ${arr(c.traits)}, ${arr(c.keywords)}, 0, true)`,
    );
  });

  it("starter deck v4", () => {
    const deckSql = readFileSync("supabase/migrations/20261121000200_ruleset4.sql", "utf8");
    for (const [id, n] of Object.entries(STARTER_DECK_V4))
      expect(deckSql).toContain(`('starter_v4', 1, '${id}', ${n})`);
  });
});
