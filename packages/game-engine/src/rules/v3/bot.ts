import type { RandomSource } from "../../rng/seeded-random.ts";
import { getCardDefinition } from "./cards.ts";
import type { LegalCommand } from "./match.ts";
import type { UnitInstance } from "./state.ts";
import { unitAtk, unitHp, unitKeywords, unitMaxHp } from "./stats.ts";
import type { PlayerView } from "./view.ts";

/**
 * Rule-based `normal` bot for ruleset 3. It sees only its seat's PlayerView and the
 * legal commands, scores each one and picks the best (ties → RNG).
 */
export function chooseBotCommand(
  view: PlayerView,
  legal: readonly LegalCommand[],
  rng: RandomSource,
): LegalCommand {
  if (legal.length === 0) throw new Error("Bot has no legal command");
  const me = view.players[view.seat];
  const foe = view.players[view.seat === 0 ? 1 : 0];
  const mine = (id: string): UnitInstance | undefined => me.units.find((u) => u.instanceId === id);
  const theirs = (id: string): UnitInstance | undefined =>
    foe.units.find((u) => u.instanceId === id);
  const handCard = (id: string) => view.myHand.find((c) => c.instanceId === id);
  const readyAtk = me.units
    .filter((u) => !u.exhausted)
    .reduce((n, u) => n + unitAtk(me.units, u), 0);

  const activeScore = (c: LegalCommand & { type: "activate" }): number => {
    const src = mine(c.instanceId);
    const a = src ? getCardDefinition(src.cardId).active : null;
    if (!src || !a) return -1;
    const e = a.effect;
    const enemy = c.target ? theirs(c.target) : undefined;
    const ally = c.target ? mine(c.target) : undefined;
    switch (e.type) {
      case "damage":
        if (c.target === "player" || !c.target) return foe.hp <= e.amount ? 100 : 22;
        if (!enemy) return -1;
        return e.amount >= unitHp(foe.units, enemy) ? 48 + unitAtk(foe.units, enemy) : 24;
      case "heal": {
        if (c.target === "player") return me.hp <= 12 ? 30 : -1;
        if (!c.target) return me.units.some((u) => u.damage > 0) ? 28 : -1;
        return ally && ally.damage > 0 ? 26 + Math.min(ally.damage, e.amount) : -1;
      }
      case "exhaust":
        return enemy && !enemy.exhausted ? 34 + unitAtk(foe.units, enemy) : -1;
      case "ready":
        return ally?.exhausted ? 36 : -1;
      case "atk":
        if (e.amount < 0) return enemy ? 26 + unitAtk(foe.units, enemy) : -1;
        return src.exhausted ? -1 : 38;
      case "keyword":
        return ally ? 25 : -1;
      case "max_hp":
        return ally ? 24 : -1;
      case "draw":
      case "search":
        return view.myHand.length <= 6 ? 30 : -1;
    }
  };

  const score = (c: LegalCommand): number => {
    switch (c.type) {
      case "mulligan":
        return 1;
      case "end_turn":
        return 0;
      case "summon": {
        const card = handCard(c.instanceId);
        return card ? 60 + getCardDefinition(card.cardId).cost : 0;
      }
      case "activate":
        return activeScore(c);
      case "attack": {
        const attacker = mine(c.attackerId);
        if (!attacker) return -1;
        const atk = unitAtk(me.units, attacker);
        if (c.target === "player") return readyAtk >= foe.hp ? 100 : 20 + atk;
        const target = theirs(c.target);
        if (!target) return -1;
        const kills = atk >= unitHp(foe.units, target);
        const survives = unitAtk(foe.units, target) < unitHp(me.units, attacker);
        if (kills && survives) return 30 + unitAtk(foe.units, target);
        if (kills)
          return (
            15 + unitAtk(foe.units, target) - atk + (unitKeywords(target).has("guard") ? 10 : 0)
          );
        return unitKeywords(target).has("guard") && unitMaxHp(foe.units, target) > 0 ? 5 : -1;
      }
    }
  };

  let best: LegalCommand[] = [];
  let bestScore = -Infinity;
  for (const c of legal) {
    const s = score(c);
    if (s > bestScore) {
      bestScore = s;
      best = [c];
    } else if (s === bestScore) best.push(c);
  }
  const pick = best[rng.nextInt(best.length)];
  if (!pick) throw new Error("Bot selection failed");
  return pick;
}
