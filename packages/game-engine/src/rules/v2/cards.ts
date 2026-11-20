import type { CardDefinition, CardEffect, Keyword, Rarity, Trait } from "./types.ts";

/** Sample Card Library V1.1 (aummon_game_spec.md §6.5.4). */
const DEF_VERSION = "1.1.0";
const RULESET = "1.1.0";

/** Rarity by stage — provisional owner decision 2026-11-20 (cosmetic only). */
const rarityFor = (stage: number): Rarity =>
  stage === 0 ? "normal" : stage === 1 ? "rare" : "super_rare";

function unit(
  code: string,
  cardId: string,
  name: string,
  stage: number,
  cost: number,
  atk: number,
  hp: number,
  keywords: readonly Keyword[],
  traits: readonly Trait[],
  effects: readonly CardEffect[] = [],
): CardDefinition {
  return {
    cardId,
    code,
    name,
    cardType: "unit",
    rarity: rarityFor(stage),
    stage,
    cost,
    atk,
    hp,
    traits,
    keywords,
    effects,
    slotCost: 0,
    compatibility: null,
    deckable: stage === 0,
    definitionVersion: DEF_VERSION,
    rulesetCompatibility: RULESET,
  };
}

function action(code: string, name: string, effects: readonly CardEffect[]): CardDefinition {
  return {
    cardId: code,
    code,
    name,
    cardType: "action",
    rarity: "normal",
    stage: 0,
    cost: 1,
    atk: 0,
    hp: 0,
    traits: [],
    keywords: [],
    effects,
    slotCost: 0,
    compatibility: null,
    deckable: true,
    definitionVersion: DEF_VERSION,
    rulesetCompatibility: RULESET,
  };
}

function equipment(
  code: string,
  name: string,
  anyOfTraits: readonly Trait[],
  effects: readonly CardEffect[],
): CardDefinition {
  return {
    cardId: code,
    code,
    name,
    cardType: "equipment",
    rarity: "normal",
    stage: 0,
    cost: 1,
    atk: 0,
    hp: 0,
    traits: [],
    keywords: [],
    effects,
    slotCost: 1,
    compatibility: { anyOfTraits },
    deckable: true,
    definitionVersion: DEF_VERSION,
    rulesetCompatibility: RULESET,
  };
}

const evoDiscount: CardEffect = { type: "MODIFY_COST", scope: "own_evolution", amount: -1 };
const anyEquip: CardEffect = { type: "ATTACH_EQUIPMENT", scope: "any_compatibility" };

export const CARD_DEFINITIONS_V2: readonly CardDefinition[] = [
  unit("U001", "U001_RUBBER_DUCKLING", "Rubber Duckling", 0, 1, 2, 3, ["haste"], ["TOY"]),
  unit("U002", "U002_TIN_CAN_GUARDIAN", "Tin Can Guardian", 0, 1, 1, 4, ["guard"], ["METAL"]),
  unit("U003", "U003_PAPER_GLIDER", "Paper Glider", 0, 1, 2, 2, ["flying"], ["PAPER"]),
  unit(
    "U004",
    "U004_POCKET_FLASHLIGHT",
    "Pocket Flashlight",
    0,
    2,
    2,
    4,
    [],
    ["LIGHT_SOURCE"],
    [evoDiscount],
  ),
  unit("U005", "U005_MINI_SKATEBOARD", "Mini Skateboard", 0, 2, 3, 3, ["boost"], ["RIDEABLE"]),
  unit(
    "U006",
    "U006_THERMOS_GOLEM",
    "Thermos Golem",
    0,
    2,
    2,
    5,
    ["guard"],
    ["CONTAINER", "METAL"],
  ),
  unit("U007", "U007_BATTERY_BUDDY", "Battery Buddy", 0, 2, 2, 4, [], ["POWER"], [anyEquip]),
  unit("U008", "U008_WINDUP_ROBOT", "Wind-up Robot", 0, 2, 3, 3, ["haste"], ["CLOCKWORK"]),
  unit(
    "U101",
    "U101_TURBO_BATH_DUCK",
    "Turbo Bath Duck",
    1,
    2,
    4,
    5,
    ["haste", "piercing"],
    ["TOY"],
  ),
  unit("U102", "U102_STEEL_CAN_BASTION", "Steel Can Bastion", 1, 2, 2, 7, ["guard"], ["METAL"]),
  unit("U103", "U103_PAPER_JET", "Paper Jet", 1, 2, 4, 4, ["flying", "piercing"], ["PAPER"]),
  unit(
    "U104",
    "U104_SOLAR_SEARCHLIGHT",
    "Solar Searchlight",
    1,
    2,
    3,
    6,
    ["guard"],
    ["LIGHT_SOURCE"],
  ),
  unit(
    "U105",
    "U105_ROCKET_SKATEBOARD",
    "Rocket Skateboard",
    1,
    3,
    5,
    5,
    ["boost", "haste"],
    ["RIDEABLE"],
  ),
  unit(
    "U106",
    "U106_PRESSURE_TANK_GOLEM",
    "Pressure Tank Golem",
    1,
    3,
    3,
    8,
    ["guard"],
    ["CONTAINER", "METAL"],
  ),
  unit(
    "U107",
    "U107_PORTABLE_POWER_HUB",
    "Portable Power Hub",
    1,
    2,
    3,
    6,
    [],
    ["POWER"],
    [anyEquip],
  ),
  unit(
    "U108",
    "U108_OVERWOUND_CLOCKWORK",
    "Overwound Clockwork",
    1,
    2,
    4,
    5,
    ["haste", "piercing"],
    ["CLOCKWORK"],
  ),
  unit("U201", "U201_AMPHIBIOUS_GLIDER", "Amphibious Glider", 2, 3, 6, 7, ["flying"], ["FUSION"]),
  // U202/U203 keywords are conditional: granted only via Fusion inheritance (FU-002/FU-003).
  unit("U202", "U202_FORTRESS_KETTLE", "Fortress Kettle", 2, 4, 4, 9, [], ["FUSION"]),
  unit("U203", "U203_ELECTRIC_RIDE", "Electric Ride", 2, 4, 6, 8, [], ["FUSION"]),
  action("A001", "Quick Doodle", [{ type: "DRAW_CARD", count: 2 }]),
  action("A002", "Lost & Found", [{ type: "SEARCH_CARD", cardType: "equipment", count: 1 }]),
  action("A003", "Scrap Return", [{ type: "RECYCLE_CARD", cardType: "equipment", count: 1 }]),
  equipment(
    "E001",
    "Clip-on Propeller",
    ["TOY", "PAPER"],
    [{ type: "ADD_KEYWORD", keyword: "flying" }],
  ),
  equipment(
    "E002",
    "Reinforced Lid",
    ["CONTAINER", "METAL"],
    [{ type: "MODIFY_STAT", stat: "hp", amount: 2 }],
  ),
  equipment("E003", "Power Charger", [], [{ type: "MODIFY_STAT", stat: "atk", amount: 1 }]),
];

const BY_ID = new Map(CARD_DEFINITIONS_V2.map((c) => [c.cardId, c]));

export function getCardDefinition(cardId: string): CardDefinition {
  const card = BY_ID.get(cardId);
  if (!card) throw new Error(`Unknown card definition: ${cardId}`);
  return card;
}
