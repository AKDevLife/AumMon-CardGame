import type { PlayerId, RandomSource } from "../domain/types.ts";
import type { LegalAction } from "../rules/v1/actions.ts";
import type { PlayerGameView } from "../views/player-view.ts";

/** Bots see only their seat's view + legal actions (blueprint §5.6, §4.1). */
export interface BotDecisionContext {
  playerId: PlayerId;
  publicView: Omit<PlayerGameView, "myHand">;
  myHand: PlayerGameView["myHand"];
  legalActions: LegalAction[];
}

export interface BotStrategy {
  chooseAction(context: BotDecisionContext, rng: RandomSource): LegalAction;
  /** Aqua window (clarification Q7): target id to swap with, or null to skip. */
  chooseSwapTarget(
    context: Omit<BotDecisionContext, "legalActions">,
    rng: RandomSource,
  ): PlayerId | null;
}

/**
 * Rule-based `normal` bot (clarification Q12). Scores each legal action and picks
 * the best; ties broken by the injected RNG.
 */
export const normalBot: BotStrategy = {
  chooseAction({ playerId, publicView, legalActions }, rng) {
    if (legalActions.length === 0) throw new Error("Bot has no legal action");
    const me = publicView.players.find((p) => p.id === playerId);
    const opponents = publicView.players.filter((p) => p.id !== playerId && p.status === "alive");
    const lowHp = me !== undefined && me.hp <= 1;
    const hpOf = (id?: string) => opponents.find((p) => p.id === id)?.hp ?? 99;
    const weakest = Math.min(...opponents.map((p) => p.hp));

    const score = (a: LegalAction): number => {
      switch (a.effect) {
        case "attack":
          return (
            50 +
            (hpOf(a.targetPlayerId) === weakest ? 20 : 0) +
            (hpOf(a.targetPlayerId) === 1 ? 20 : 0)
          );
        case "aoe":
          return opponents.length >= 2 ? 65 + opponents.filter((p) => p.hp === 1).length * 10 : 45;
        case "disrupt":
          return 35 + (hpOf(a.targetPlayerId) === weakest ? 5 : 0);
        case "defense":
          return lowHp ? 80 : 30;
        case "redirect":
          return lowHp ? 70 : 25;
        case "support":
          if (a.choice === "heal") return me && me.hp < me.maxHp ? (lowHp ? 85 : 55) : 0;
          return 40;
      }
    };

    const scored = legalActions.map((a) => ({ a, s: score(a) }));
    const best = Math.max(...scored.map((x) => x.s));
    const top = scored.filter((x) => x.s === best);
    const pick = top[rng.nextInt(top.length)];
    if (!pick) throw new Error("Bot failed to choose");
    return pick.a;
  },

  chooseSwapTarget({ playerId, publicView }) {
    const candidates = publicView.players
      .filter((p) => p.id !== playerId && p.status === "alive")
      .sort((a, b) => b.hp - a.hp || a.seat - b.seat);
    return candidates[0]?.id ?? null;
  },
};
