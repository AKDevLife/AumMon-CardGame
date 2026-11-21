import { getCardDefinition } from "./cards.ts";
import type { UnitInstance } from "./state.ts";
import type { Keyword, StaticPassive } from "./types.ts";

/**
 * Effective Object stats: definition + static Passives of the same side + modifiers.
 * `side` is the owner's units (the unit itself included). Static effects stop as soon
 * as their source leaves the field (framework §3.2).
 */
function staticBonus(side: readonly UnitInstance[], u: UnitInstance, stat: "atk" | "hp"): number {
  let total = 0;
  for (const src of side) {
    const p = getCardDefinition(src.cardId).passive;
    if (p?.kind !== "static" || p.stat !== stat) continue;
    total += staticAmount(p, side, src, u);
  }
  return total;
}

function staticAmount(
  p: StaticPassive,
  side: readonly UnitInstance[],
  src: UnitInstance,
  u: UnitInstance,
): number {
  const others = side.filter((x) => x !== src);
  const hasTrait = (x: UnitInstance, t: string) =>
    (getCardDefinition(x.cardId).traits as readonly string[]).includes(t);
  if (p.to === "self" && u !== src) return 0;
  if (p.to === "other_allies" && (u === src || (p.trait && !hasTrait(u, p.trait)))) return 0;
  if (p.ifAlly && !others.some((x) => hasTrait(x, p.ifAlly ?? ""))) return 0;
  if (p.perAlly) return p.amount * others.filter((x) => hasTrait(x, p.perAlly ?? "")).length;
  return p.amount;
}

export function unitKeywords(u: UnitInstance): Set<Keyword> {
  const out = new Set<Keyword>(getCardDefinition(u.cardId).keywords);
  for (const m of u.mods) if (m.keyword) out.add(m.keyword);
  return out;
}

export const unitAtk = (side: readonly UnitInstance[], u: UnitInstance): number =>
  Math.max(
    0,
    getCardDefinition(u.cardId).atk +
      staticBonus(side, u, "atk") +
      u.mods.reduce((n, m) => n + m.atk, 0),
  );

export const unitMaxHp = (side: readonly UnitInstance[], u: UnitInstance): number =>
  getCardDefinition(u.cardId).hp + u.hpBonus + staticBonus(side, u, "hp");

export const unitHp = (side: readonly UnitInstance[], u: UnitInstance): number =>
  unitMaxHp(side, u) - u.damage;
