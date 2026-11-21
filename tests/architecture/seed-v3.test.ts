/** Guards drift between the ruleset 3 migration and the engine card data (task 10.3). */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CARD_DEFINITIONS_V3,
  STARTER_DECK_V3,
} from "../../packages/game-engine/src/rules/v3/index.ts";

const sql = readFileSync("supabase/migrations/20261121000000_ruleset3.sql", "utf8");
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const arr = (a: readonly string[]) => `'{${a.join(",")}}'`;

describe("ruleset 3 migration matches engine data", () => {
  it.each(CARD_DEFINITIONS_V3.map((c) => [c.cardId, c] as const))("card %s", (_id, c) => {
    const spec = JSON.stringify({
      nameEn: c.nameEn,
      archetype: c.archetype,
      passive: c.passive,
      active: c.active,
    });
    expect(sql).toContain(
      `(${q(c.cardId)}, ${q(c.name)}, 'unit', ${q(c.flavor)}, ${q(spec)}, '3', '${c.rarity}', 0, ${c.cost}, ${c.atk}, ${c.hp}, ${arr(c.traits)}, ${arr(c.keywords)}, 0, true)`,
    );
  });

  it("starter deck v3", () => {
    for (const [id, n] of Object.entries(STARTER_DECK_V3))
      expect(sql).toContain(`('starter_v3', 1, '${id}', ${n})`);
  });
});
