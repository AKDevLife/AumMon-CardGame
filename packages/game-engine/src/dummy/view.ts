import { actingSeat, type Card, type DummyState } from "./engine.ts";

/** What one seat may see: own hand; others' hand sizes; the public table. */
export interface DummyView {
  readonly seat: number | null;
  readonly status: DummyState["status"];
  readonly acting: number | null;
  readonly phase: DummyState["phase"];
  readonly turnNumber: number;
  readonly myHand: readonly Card[];
  readonly players: readonly {
    playerId: string;
    handCount: number;
    points: number;
    tookHead: boolean;
  }[];
  readonly discard: readonly Card[];
  readonly head: Card;
  readonly headTaken: boolean;
  readonly melds: readonly { owner: number; cards: readonly Card[] }[];
  readonly stockCount: number;
  readonly scores: readonly number[] | null;
  readonly winners: readonly number[];
  readonly knocker: number | null;
}

export function getDummyView(s: DummyState, seat: number | null): DummyView {
  const me = seat === null ? undefined : s.players[seat];
  return {
    seat,
    status: s.status,
    acting: actingSeat(s),
    phase: s.phase,
    turnNumber: s.turnNumber,
    myHand: me ? [...me.hand] : [],
    players: s.players.map((p) => ({
      playerId: p.playerId,
      handCount: p.hand.length,
      points: p.points,
      tookHead: p.tookHead,
    })),
    discard: [...s.discard],
    head: s.head,
    headTaken: s.players.some((p) => p.tookHead),
    melds: s.melds.map((m) => ({ owner: m.owner, cards: [...m.cards] })),
    stockCount: s.stock.length,
    scores: s.scores ? [...s.scores] : null,
    winners: [...s.winners],
    knocker: s.knocker,
  };
}
