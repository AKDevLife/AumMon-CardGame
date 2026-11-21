/**
 * Ruleset 4 card data contract — Object cards with Passive + free Active abilities
 * (aummon_game_spec.md v5.0, owner decisions R3 D1–D11).
 */
export type Keyword = "haste" | "guard" | "flying" | "piercing";
export type Trait = "STATIONERY" | "CONTAINER" | "VEHICLE" | "ELECTRONIC" | "TOOL" | "FREE";
export type Archetype = "aggro" | "defensive" | "control" | "synergy";
export type Rarity = "normal" | "rare" | "super_rare";

/** turn = until end of this turn; until_next_turn = until the ability owner's next turn starts. */
export type Duration = "turn" | "until_next_turn" | "permanent";

export type Effect =
  | { readonly type: "atk"; readonly amount: number; readonly duration: Duration }
  | { readonly type: "max_hp"; readonly amount: number }
  | { readonly type: "damage"; readonly amount: number }
  | { readonly type: "heal"; readonly amount: number }
  | { readonly type: "draw"; readonly count: number }
  | { readonly type: "exhaust" }
  | { readonly type: "ready" }
  | { readonly type: "keyword"; readonly keyword: Keyword; readonly duration: Duration }
  | { readonly type: "search"; readonly trait: Trait };

/** Automatic targets (no player choice) — the only kind triggered Passives may use. */
export type AutoTarget =
  "self" | "all_allies" | "other_allies" | "all_enemies" | "enemy_player" | "own_player" | "none";

/** Targets the player picks for an Active (instance id, or "player"). */
export type PickTarget =
  | { readonly pick: "enemy_unit"; readonly readyOnly?: boolean }
  | { readonly pick: "enemy_unit_or_player" }
  | {
      readonly pick: "ally";
      readonly other?: boolean;
      readonly trait?: Trait;
      readonly exhaustedOnly?: boolean;
    }
  | { readonly pick: "ally_or_own_player" };

export type Trigger = "on_summon" | "on_attack" | "on_destroyed" | "on_turn_start" | "on_turn_end";

interface Named {
  /** Thai ability name and rules text shown on the card. */
  readonly name: string;
  readonly text: string;
}

/** Static Passive: recomputed continuously while the source is on the field. */
export interface StaticPassive extends Named {
  readonly kind: "static";
  readonly stat: "atk" | "hp";
  readonly amount: number;
  /** Who gets the bonus: this Object, or the owner's other Objects (optionally with a trait). */
  readonly to: "self" | "other_allies";
  readonly trait?: Trait;
  /** Only while the owner has another Object with this trait. */
  readonly ifAlly?: Trait;
  /** Bonus × number of the owner's other Objects with this trait. */
  readonly perAlly?: Trait;
}

export interface TriggeredPassive extends Named {
  readonly kind: "triggered";
  readonly on: Trigger;
  readonly target: AutoTarget;
  readonly effect: Effect;
}

export type Passive = StaticPassive | TriggeredPassive;

export interface Active extends Named {
  readonly target: AutoTarget | PickTarget;
  readonly effect: Effect;
  /**
   * Card says "หลับตอนจบเทิร์น": the source stays Ready now (it may still attack) and
   * falls asleep at the end of this turn — "boost then the battery runs out" (owner 2026-11-21).
   */
  readonly sleepAtEndOfTurn?: boolean;
}

export interface CardDefinition {
  readonly cardId: string;
  /** Thai display name; English name for reference. */
  readonly name: string;
  readonly nameEn: string;
  readonly archetype: Archetype;
  readonly rarity: Rarity;
  readonly cost: number;
  readonly atk: number;
  readonly hp: number;
  readonly keywords: readonly Keyword[];
  readonly traits: readonly Trait[];
  readonly passive: Passive | null;
  readonly active: Active | null;
  readonly flavor: string;
  readonly definitionVersion: string;
}
