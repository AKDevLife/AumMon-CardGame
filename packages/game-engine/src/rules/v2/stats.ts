import { getCardDefinition } from "./cards.ts";
import type { UnitInstance } from "./state.ts";
import type { Keyword } from "./types.ts";

/** Effective unit stats: definition + equipment + temporary effects (spec §4.7, §4.10, §5.12). */
export function unitKeywords(u: UnitInstance): Set<Keyword> {
  const out = new Set<Keyword>([...getCardDefinition(u.cardId).keywords, ...u.bonusKeywords]);
  for (const e of u.equipment)
    for (const fx of getCardDefinition(e.cardId).effects)
      if (fx.type === "ADD_KEYWORD") out.add(fx.keyword);
  return out;
}

function equipmentBonus(u: UnitInstance, stat: "atk" | "hp"): number {
  let total = 0;
  for (const e of u.equipment)
    for (const fx of getCardDefinition(e.cardId).effects)
      if (fx.type === "MODIFY_STAT" && fx.stat === stat) total += fx.amount;
  return total;
}

export const unitAtk = (u: UnitInstance): number =>
  Math.max(0, getCardDefinition(u.cardId).atk + equipmentBonus(u, "atk") + u.tempAtk);

export const unitMaxHp = (u: UnitInstance): number =>
  getCardDefinition(u.cardId).hp + equipmentBonus(u, "hp");

export const unitHp = (u: UnitInstance): number => unitMaxHp(u) - u.damage;

/** Equipment compatibility (spec §4.10): traits, or ATTACH_EQUIPMENT any_compatibility on the unit. */
export function canEquip(u: UnitInstance, equipmentCardId: string): boolean {
  const eq = getCardDefinition(equipmentCardId);
  const def = getCardDefinition(u.cardId);
  if (def.effects.some((fx) => fx.type === "ATTACH_EQUIPMENT")) return true;
  const traits = eq.compatibility?.anyOfTraits ?? [];
  return traits.length === 0 || traits.some((t) => def.traits.includes(t));
}

export const usedSlots = (u: UnitInstance): number =>
  u.equipment.reduce((n, e) => n + getCardDefinition(e.cardId).slotCost, 0);
