/** Guards drift between the ruleset 5 migration and the engine card data (task 11.1). */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CARD_DEFINITIONS_V5,
  STARTER_DECK_V5,
} from "../../packages/game-engine/src/rules/v5/index.ts";

const sql = readFileSync("supabase/migrations/20261121000500_balance_pass.sql", "utf8");
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const arr = (a: readonly string[]) => `'{${a.join(",")}}'`;

describe("ruleset 5 migration matches engine data", () => {
  it.each(CARD_DEFINITIONS_V5.map((c) => [c.cardId, c] as const))("card %s", (_id, c) => {
    const spec = JSON.stringify({
      nameEn: c.nameEn,
      archetype: c.archetype,
      passive: c.passive,
      active: c.active,
    });
    expect(sql).toContain(
      `(${q(c.cardId)}, ${q(c.name)}, 'unit', ${q(c.flavor)}, ${q(spec)}, '5', '${c.rarity}', 0, ${c.cost}, ${c.atk}, ${c.hp}, ${arr(c.traits)}, ${arr(c.keywords)}, 0, true)`,
    );
  });

  it("starter deck v5", () => {
    const deckSql = readFileSync("supabase/migrations/20261121000400_ruleset5.sql", "utf8");
    for (const [id, n] of Object.entries(STARTER_DECK_V5))
      expect(deckSql).toContain(`('starter_v5', 1, '${id}', ${n})`);
  });
});
