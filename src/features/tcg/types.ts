import type { v4 } from "@aummon/game-engine";

/** Response of the ruleset 4 Edge Functions (supabase/functions/_shared/tcg.ts). */
export interface TcgResponse {
  matchId: string;
  rulesetVersion: "4";
  mode: "solo" | "pass_play" | "online";
  version: number;
  deadline: string | null;
  seat: v4.Seat | null;
  actingSeat: v4.Seat | null;
  botActing?: boolean;
  names: [string, string];
  view: v4.PlayerView;
  legal: v4.LegalCommand[];
  events: v4.GameEvent[];
}
