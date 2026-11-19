import type { MatchMode, PlayerGameView } from "@aummon/game-engine";

export interface MatchResponse {
  mode: MatchMode;
  /** Pass & Play: seat whose turn it is (server-decided). */
  currentSeat: { playerId: string; displayName: string } | null;
  view: PlayerGameView;
  viewerPlayerId: string | null;
  deadline: string | null;
}
