import type { EvolutionRecipe, FusionRecipe, Trait } from "./types.ts";

/** Recipe Library V1.1 (aummon_game_spec.md §6.5.2–6.5.3). */
const evo = (
  recipeId: string,
  sourceCardId: string,
  targetCardId: string,
  requiredTrait: Trait,
  cost: number,
): EvolutionRecipe => ({
  recipeId,
  sourceCardId,
  targetCardId,
  requiredStage: 0,
  requiredTrait,
  cost,
  equipmentPolicy: "keep_compatible",
  recipeVersion: "1.1.0",
});

export const EVOLUTION_RECIPES_V2: readonly EvolutionRecipe[] = [
  evo("EV-001", "U001_RUBBER_DUCKLING", "U101_TURBO_BATH_DUCK", "TOY", 2),
  evo("EV-002", "U002_TIN_CAN_GUARDIAN", "U102_STEEL_CAN_BASTION", "METAL", 2),
  evo("EV-003", "U003_PAPER_GLIDER", "U103_PAPER_JET", "PAPER", 2),
  evo("EV-004", "U004_POCKET_FLASHLIGHT", "U104_SOLAR_SEARCHLIGHT", "LIGHT_SOURCE", 2),
  evo("EV-005", "U005_MINI_SKATEBOARD", "U105_ROCKET_SKATEBOARD", "RIDEABLE", 3),
  evo("EV-006", "U006_THERMOS_GOLEM", "U106_PRESSURE_TANK_GOLEM", "CONTAINER", 3),
  evo("EV-007", "U007_BATTERY_BUDDY", "U107_PORTABLE_POWER_HUB", "POWER", 2),
  evo("EV-008", "U008_WINDUP_ROBOT", "U108_OVERWOUND_CLOCKWORK", "CLOCKWORK", 2),
];

export const FUSION_RECIPES_V2: readonly FusionRecipe[] = [
  {
    recipeId: "FU-001",
    parentCardIds: ["U001_RUBBER_DUCKLING", "U003_PAPER_GLIDER"],
    resultCardId: "U201_AMPHIBIOUS_GLIDER",
    cost: 3,
    inheritedKeywords: [],
    recipeVersion: "1.1.0",
  },
  {
    recipeId: "FU-002",
    parentCardIds: ["U002_TIN_CAN_GUARDIAN", "U006_THERMOS_GOLEM"],
    resultCardId: "U202_FORTRESS_KETTLE",
    cost: 4,
    inheritedKeywords: ["guard"],
    recipeVersion: "1.1.0",
  },
  {
    recipeId: "FU-003",
    parentCardIds: ["U005_MINI_SKATEBOARD", "U007_BATTERY_BUDDY"],
    resultCardId: "U203_ELECTRIC_RIDE",
    cost: 4,
    inheritedKeywords: ["boost"],
    recipeVersion: "1.1.0",
  },
];
