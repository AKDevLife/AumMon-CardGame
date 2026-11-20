/**
 * Ruleset 2 card data contract (aummon_game_spec.md §6.2, §8.2).
 * Card Definitions and Recipes are immutable template data; match state
 * (instances, damage, exhaustion) lives elsewhere (spec §3.3).
 */
export type CardType = "unit" | "action" | "equipment" | "field";
export type Rarity = "normal" | "rare" | "super_rare";
export type Keyword = "haste" | "guard" | "flying" | "piercing" | "boost";
export type Trait =
  | "TOY"
  | "METAL"
  | "PAPER"
  | "LIGHT_SOURCE"
  | "RIDEABLE"
  | "CONTAINER"
  | "POWER"
  | "CLOCKWORK"
  | "FUSION";

/** Effect descriptors use the effect types of spec §5.5. */
export type CardEffect =
  | { readonly type: "DRAW_CARD"; readonly count: number }
  | { readonly type: "SEARCH_CARD"; readonly cardType: CardType; readonly count: number }
  | {
      readonly type: "RECYCLE_CARD";
      readonly cardType: CardType;
      readonly count: number;
    }
  | { readonly type: "ADD_KEYWORD"; readonly keyword: Keyword }
  | { readonly type: "MODIFY_STAT"; readonly stat: "atk" | "hp"; readonly amount: number }
  /** U004: own Evolution cost −1 (cost floor 1, spec §4.2). */
  | { readonly type: "MODIFY_COST"; readonly scope: "own_evolution"; readonly amount: number }
  /** U007/U107: may attach any Equipment regardless of compatibility. */
  | { readonly type: "ATTACH_EQUIPMENT"; readonly scope: "any_compatibility" };

export interface Compatibility {
  /** Empty = attaches to any Unit. Otherwise the Unit needs one of these traits. */
  readonly anyOfTraits: readonly Trait[];
}

export interface CardDefinition {
  readonly cardId: string;
  readonly code: string;
  readonly name: string;
  readonly cardType: CardType;
  readonly rarity: Rarity;
  readonly stage: number;
  /** Play cost for deck cards; Recipe cost applies to Evolution/Fusion results. */
  readonly cost: number;
  readonly atk: number;
  readonly hp: number;
  readonly traits: readonly Trait[];
  readonly keywords: readonly Keyword[];
  readonly effects: readonly CardEffect[];
  /** Equipment only: slots used on the Unit. */
  readonly slotCost: number;
  readonly compatibility: Compatibility | null;
  /** False for Evolution/Fusion results — only created via Recipes. */
  readonly deckable: boolean;
  readonly definitionVersion: string;
  readonly rulesetCompatibility: string;
}

export interface EvolutionRecipe {
  readonly recipeId: string;
  readonly sourceCardId: string;
  readonly targetCardId: string;
  readonly requiredStage: number;
  readonly requiredTrait: Trait;
  readonly cost: number;
  /** Spec §6.5.1: keep instance, keep exhaustion, full HP, keep compatible equipment. */
  readonly equipmentPolicy: "keep_compatible";
  readonly recipeVersion: string;
}

export interface FusionRecipe {
  readonly recipeId: string;
  readonly parentCardIds: readonly [string, string];
  readonly resultCardId: string;
  readonly cost: number;
  /** Keywords inherited only if a parent actually has them (max 2, spec §4.11). */
  readonly inheritedKeywords: readonly Keyword[];
  readonly recipeVersion: string;
}
