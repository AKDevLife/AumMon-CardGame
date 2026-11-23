import type { Card } from "./cards.ts";
import {
  actingSeat,
  legalActions,
  pots,
  type HandSummary,
  type PokerState,
  type Street,
} from "./engine.ts";

/** What one seat may see: own hole cards only; others' cards only when shown at showdown. */
export interface PokerView {
  readonly seat: number | null;
  readonly status: PokerState["status"];
  readonly hand: number;
  readonly street: Street;
  readonly board: readonly Card[];
  readonly dealer: number;
  readonly acting: number | null;
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly currentBet: number;
  readonly pot: number;
  readonly pots: readonly { amount: number; eligible: readonly number[] }[];
  readonly myCards: readonly Card[];
  readonly players: readonly {
    playerId: string;
    stack: number;
    bet: number;
    folded: boolean;
    allIn: boolean;
    out: boolean;
    hasCards: boolean;
  }[];
  readonly legal: ReturnType<typeof legalActions>;
  readonly lastHand: HandSummary | null;
  readonly winners: readonly number[];
}

export function getPokerView(s: PokerState, seat: number | null): PokerView {
  const me = seat === null ? undefined : s.players[seat];
  return {
    seat,
    status: s.status,
    hand: s.hand,
    street: s.street,
    board: [...s.board],
    dealer: s.dealer,
    acting: actingSeat(s),
    smallBlind: s.smallBlind,
    bigBlind: s.bigBlind,
    currentBet: s.currentBet,
    pot: s.players.reduce((a, x) => a + x.total, 0),
    pots: pots(s),
    myCards: me ? [...me.hole] : [],
    players: s.players.map((x) => ({
      playerId: x.playerId,
      stack: x.stack,
      bet: x.bet,
      folded: x.folded,
      allIn: x.allIn,
      out: x.out,
      hasCards: x.hole.length > 0 && !x.folded,
    })),
    legal: seat === null ? null : legalActions(s, seat),
    lastHand: s.lastHand,
    winners: [...s.winners],
  };
}
