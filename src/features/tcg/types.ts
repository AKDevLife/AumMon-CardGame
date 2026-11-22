import type { v6 } from "@aummon/game-engine";

/** Response of the ruleset 4 Edge Functions (supabase/functions/_shared/tcg.ts). */
export interface TcgResponse {
  matchId: string;
  rulesetVersion: "6";
  mode: "solo" | "pass_play" | "online";
  version: number;
  deadline: string | null;
  seat: v6.Seat | null;
  actingSeat: v6.Seat | null;
  botActing?: boolean;
  names: [string, string];
  view: v6.PlayerView;
  legal: v6.LegalCommand[];
  events: v6.GameEvent[];
}
