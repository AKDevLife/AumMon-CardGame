import type { v5 } from "@aummon/game-engine";

/** Response of the ruleset 4 Edge Functions (supabase/functions/_shared/tcg.ts). */
export interface TcgResponse {
  matchId: string;
  rulesetVersion: "5";
  mode: "solo" | "pass_play" | "online";
  version: number;
  deadline: string | null;
  seat: v5.Seat | null;
  actingSeat: v5.Seat | null;
  botActing?: boolean;
  names: [string, string];
  view: v5.PlayerView;
  legal: v5.LegalCommand[];
  events: v5.GameEvent[];
}
