import type { PlayerGameView } from "@aummon/game-engine";

export interface MatchResponse {
  view: PlayerGameView;
  viewerPlayerId: string | null;
  deadline: string | null;
}
