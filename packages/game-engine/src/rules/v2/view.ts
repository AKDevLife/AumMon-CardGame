import type {
  CardInstance,
  MatchResult,
  MatchStatus,
  MatchState,
  Seat,
  TurnPhase,
  UnitInstance,
} from "./state.ts";

/** Client-safe view: own hand visible; opponent hand and both deck orders hidden (spec §1.3). */
export interface PublicPlayer {
  readonly playerId: string;
  readonly hp: number;
  readonly spark: number;
  readonly maxSpark: number;
  readonly handCount: number;
  readonly deckCount: number;
  readonly units: readonly UnitInstance[];
  readonly discard: readonly CardInstance[];
}

export interface PlayerView {
  readonly seat: Seat;
  readonly status: MatchStatus;
  readonly turn: number;
  readonly activeSeat: Seat;
  readonly phase: TurnPhase;
  readonly firstSeat: Seat;
  readonly myHand: readonly CardInstance[];
  readonly mulliganDone: boolean;
  readonly players: readonly [PublicPlayer, PublicPlayer];
  readonly result: MatchResult | null;
}

export function getPlayerView(state: MatchState, seat: Seat): PlayerView {
  const pub = (s: Seat): PublicPlayer => {
    const p = state.players[s];
    return {
      playerId: p.playerId,
      hp: p.hp,
      spark: p.spark,
      maxSpark: p.maxSpark,
      handCount: p.hand.length,
      deckCount: p.deck.length,
      units: p.units.map((u) => ({
        ...u,
        equipment: [...u.equipment],
        history: [...u.history],
        bonusKeywords: [...u.bonusKeywords],
      })),
      discard: [...p.discard],
    };
  };
  return {
    seat,
    status: state.status,
    turn: state.turn,
    activeSeat: state.activeSeat,
    phase: state.phase,
    firstSeat: state.firstSeat,
    myHand: [...state.players[seat].hand],
    mulliganDone: state.players[seat].mulliganDone,
    players: [pub(0), pub(1)],
    result: state.result,
  };
}
