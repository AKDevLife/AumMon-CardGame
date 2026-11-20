import { describe, expect, it } from "vitest";
import {
  CARD_DEFINITIONS_V2,
  EVOLUTION_RECIPES_V2,
  FUSION_RECIPES_V2,
  STARTER_DECK_V2,
  getCardDefinition,
  validateCardData,
} from "../src/rules/v2/index.ts";

const [ev1] = EVOLUTION_RECIPES_V2;
const [fu1] = FUSION_RECIPES_V2;

const report = () =>
  validateCardData(CARD_DEFINITIONS_V2, EVOLUTION_RECIPES_V2, FUSION_RECIPES_V2, STARTER_DECK_V2);

describe("ruleset 2 card data (spec §6.5)", () => {
  it("has 25 definitions: 19 units, 3 actions, 3 equipment", () => {
    const count = (t: string) => CARD_DEFINITIONS_V2.filter((c) => c.cardType === t).length;
    expect(CARD_DEFINITIONS_V2).toHaveLength(25);
    expect([count("unit"), count("action"), count("equipment")]).toEqual([19, 3, 3]);
  });

  it("has 8 evolution and 3 fusion recipes", () => {
    expect(EVOLUTION_RECIPES_V2).toHaveLength(8);
    expect(FUSION_RECIPES_V2).toHaveLength(3);
  });

  it("validates with no errors", () => {
    expect(report().errors).toEqual([]);
  });

  it("deck units all fall inside the power budget", () => {
    expect(report().budgetFlags).toEqual([]);
  });

  it("only stage 0 units, actions and equipment are deckable", () => {
    for (const c of CARD_DEFINITIONS_V2) expect(c.deckable).toBe(c.stage === 0);
  });

  it("starter deck has 30 cards, ≤3 copies each", () => {
    const copies = Object.values(STARTER_DECK_V2);
    expect(copies.reduce((a, b) => a + b, 0)).toBe(30);
    expect(Math.max(...copies)).toBeLessThanOrEqual(3);
  });

  it("matches spec stats for key cards", () => {
    const u = getCardDefinition("U101_TURBO_BATH_DUCK");
    expect([u.atk, u.hp, u.keywords]).toEqual([4, 5, ["haste", "piercing"]]);
    expect(getCardDefinition("U201_AMPHIBIOUS_GLIDER").hp).toBe(7);
    expect(getCardDefinition("E003").compatibility).toEqual({ anyOfTraits: [] });
  });

  it("rejects bad data", () => {
    if (!ev1 || !fu1) throw new Error("fixtures missing");
    const bad = validateCardData(
      CARD_DEFINITIONS_V2,
      [{ ...ev1, requiredTrait: "METAL" }],
      [{ ...fu1, inheritedKeywords: ["guard"] }],
      { ...STARTER_DECK_V2, U101_TURBO_BATH_DUCK: 4 },
    );
    expect(bad.errors).toEqual(
      expect.arrayContaining([
        "EV-001: source lacks trait",
        "FU-001: no parent has guard",
        "deck: U101_TURBO_BATH_DUCK is not deckable",
        "deck: U101_TURBO_BATH_DUCK has 4 copies",
        "deck: 34 cards, expected 30",
      ]),
    );
  });

  it("throws on unknown card", () => {
    expect(() => getCardDefinition("X")).toThrow();
  });
});
