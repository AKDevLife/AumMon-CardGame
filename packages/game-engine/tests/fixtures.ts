import type { CardInstance, CharacterDefinition } from "../src/domain/types.ts";
import { STANDARD_DECK_V1 } from "../src/rules/v1/constants.ts";
import type { InitializeMatchInput } from "../src/rules/v1/setup.ts";

/** Spec §3 starter characters (mirrors supabase/seed.sql). */
export const CHARACTERS: Record<string, CharacterDefinition> = {
  pyro_pup: {
    id: "pyro_pup",
    name: "Pyro",
    element: "fire",
    hp: 3,
    speed: 70,
    hook: "onAttack",
    effectKey: "BONUS_DMG_FIRST_HIT",
    description: "",
    version: 1,
  },
  aqua_otter: {
    id: "aqua_otter",
    name: "Aqua",
    element: "water",
    hp: 3,
    speed: 60,
    hook: "onTurnStart",
    effectKey: "SWAP_CARD_ONCE",
    description: "",
    version: 1,
  },
  breeze_kit: {
    id: "breeze_kit",
    name: "Breeze",
    element: "wind",
    hp: 3,
    speed: 90,
    hook: "onBeforeDamaged",
    effectKey: "DISCARD_TO_DODGE",
    description: "",
    version: 1,
  },
  terra_tortoise: {
    id: "terra_tortoise",
    name: "Terra",
    element: "earth",
    hp: 4,
    speed: 40,
    hook: "onBeforeDamaged",
    effectKey: "REDUCE_DMG_1",
    description: "",
    version: 1,
  },
};

const TYPE_OF = {
  attack: "attack",
  defense: "defense",
  support: "support",
  redirect: "chaos",
  aoe: "chaos",
  disrupt: "chaos",
} as const;

export function standardDeck(): CardInstance[] {
  return Object.entries(STANDARD_DECK_V1).flatMap(([effect, count]) =>
    Array.from({ length: count }, (_, i) => {
      const e = effect as keyof typeof TYPE_OF;
      const definitionId = TYPE_OF[e] === "chaos" ? `chaos_${e}` : e;
      return {
        id: `${effect}-${i + 1}`,
        definitionId,
        type: TYPE_OF[e],
        effect: e,
        name: definitionId,
      };
    }),
  );
}

export function matchInput(
  characterIds: string[] = ["pyro_pup", "aqua_otter"],
): InitializeMatchInput {
  return {
    matchId: "m1",
    mode: "solo",
    seats: characterIds.map((id, i) => {
      const character = CHARACTERS[id];
      if (!character) throw new Error(`unknown character ${id}`);
      return {
        playerId: `p${i + 1}`,
        seat: i + 1,
        kind: i === 0 ? "human" : "bot",
        displayName: `P${i + 1}`,
        character,
      };
    }),
    cards: standardDeck(),
  };
}
