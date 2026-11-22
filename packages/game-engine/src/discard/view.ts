import { actingSeat, canPlay, type GameState, type Seat } from "./engine.ts";

/** What one seat may see (hands of others stay hidden — Core Rules §10). */
export interface SeatView {
  readonly seat: Seat | null;
  readonly status: GameState["status"];
  readonly current: Seat;
  readonly acting: Seat | null;
  readonly firstSeat: Seat;
  readonly direction: 1 | -1;
  readonly turnNumber: number;
  readonly myHand: readonly { id: string; cardId: string }[];
  readonly players: readonly { playerId: string; handCount: number }[];
  readonly top: string | null;
  /** Last cards of the pile, oldest first (public). */
  readonly pileRecent: readonly string[];
  readonly drawCount: number;
  readonly open: boolean;
  readonly glue: Seat | null;
  readonly ruler: { seat: Seat; value: number } | null;
  readonly reaction: { target: Seat; kind: "draw" | "skip" } | null;
  readonly winner: Seat | null;
  /** Actions for this seat right now. */
  readonly playable: readonly string[];
  readonly canDraw: boolean;
  readonly canReact: boolean;
}

export function getView(s: GameState, seat: Seat | null): SeatView {
  const acting = actingSeat(s);
  const me = seat === null ? null : s.players[seat];
  const myTurn = seat !== null && acting === seat && s.reactions.length === 0;
  const pending = s.reactions[0];
  return {
    seat,
    status: s.status,
    current: s.current,
    acting,
    firstSeat: s.firstSeat,
    direction: s.direction,
    turnNumber: s.turnNumber,
    myHand: me ? me.hand.map((c) => ({ ...c })) : [],
    players: s.players.map((p) => ({ playerId: p.playerId, handCount: p.hand.length })),
    top: s.pile[s.pile.length - 1]?.cardId ?? null,
    pileRecent: s.pile.slice(-5).map((c) => c.cardId),
    drawCount: s.drawPile.length,
    open: s.open,
    glue: s.glue,
    ruler: s.ruler ? { ...s.ruler } : null,
    reaction: pending ? { target: pending.target, kind: pending.kind } : null,
    winner: s.winner,
    playable: myTurn && me ? me.hand.filter((c) => canPlay(s, seat, c)).map((c) => c.id) : [],
    canDraw: myTurn,
    canReact: seat !== null && pending?.target === seat,
  };
}
