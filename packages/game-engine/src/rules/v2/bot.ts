import type { RandomSource } from "../../rng/seeded-random.ts";
import { getCardDefinition } from "./cards.ts";
import type { LegalCommand } from "./match.ts";
import type { UnitInstance } from "./state.ts";
import { unitAtk, unitHp, unitKeywords } from "./stats.ts";
import type { PlayerView } from "./view.ts";

/**
 * Rule-based `normal` bot for ruleset 2 (blueprint §5.6). It sees only its seat's
 * PlayerView and the legal commands, scores each one and picks the best (ties → RNG).
 */
export function chooseBotCommand(
  view: PlayerView,
  legal: readonly LegalCommand[],
  rng: RandomSource,
): LegalCommand {
  if (legal.length === 0) throw new Error("Bot has no legal command");
  const me = view.players[view.seat];
  const foe = view.players[view.seat === 0 ? 1 : 0];
  const myUnit = (id: string): UnitInstance | undefined =>
    me.units.find((u) => u.instanceId === id);
  const foeUnit = (id: string): UnitInstance | undefined =>
    foe.units.find((u) => u.instanceId === id);
  const handCard = (id: string) => view.myHand.find((c) => c.instanceId === id);
  const readyAttackers = me.units.filter((u) => !u.exhausted);
  const totalReadyAtk = readyAttackers.reduce((n, u) => n + unitAtk(u), 0);

  const score = (c: LegalCommand): number => {
    switch (c.type) {
      case "mulligan":
        return 1;
      case "end_turn":
        return 0;
      case "fuse":
        return 90;
      case "evolve":
        return 80;
      case "summon": {
        const card = handCard(c.instanceId);
        return card ? 60 + getCardDefinition(card.cardId).cost : 0;
      }
      case "attach": {
        const u = myUnit(c.unitId);
        return u ? 50 + unitAtk(u) : 0;
      }
      case "play_action": {
        const card = handCard(c.instanceId);
        if (!card) return 0;
        if (getCardDefinition(card.cardId).effects.some((fx) => fx.type === "DRAW_CARD"))
          return view.myHand.length <= 6 ? 45 : -1;
        return c.choice === "E003" ? 44 : 40;
      }
      case "boost": {
        const u = myUnit(c.instanceId);
        return u && !u.exhausted ? 35 : -1;
      }
      case "attack": {
        const attacker = myUnit(c.attackerId);
        if (!attacker) return -1;
        const atk = unitAtk(attacker);
        if (c.target === "player") return totalReadyAtk >= foe.hp ? 100 : 20 + atk;
        const target = foeUnit(c.target);
        if (!target) return -1;
        const kills = atk >= unitHp(target);
        const survives = unitAtk(target) < unitHp(attacker);
        if (kills && survives) return 30 + unitAtk(target);
        if (kills) return 15 + unitAtk(target) - atk + (unitKeywords(target).has("guard") ? 10 : 0);
        return unitKeywords(target).has("guard") ? 5 : -1;
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
