import type { discard } from "@aummon/game-engine";

/** Response of the game-* Edge Functions (supabase/functions/_shared/game.ts). */
export interface GameResponse {
  matchId: string;
  rulesetVersion: "12";
  mode: "solo" | "online";
  version: number;
  deadline: string | null;
  seat: number | null;
  acting: number | null;
  botActing: boolean;
  names: string[];
  view: discard.SeatView;
  events: discard.GameEvent[];
  peeks: { target: number | null; cards: string[] }[];
  serverNow: number;
  autoSeats: number[];
  nextMatchId: string | null;
  roomId: string;
}
