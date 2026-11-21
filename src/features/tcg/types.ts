import type { v3 } from "@aummon/game-engine";

/** Response of the ruleset 3 Edge Functions (supabase/functions/_shared/tcg.ts). */
export interface TcgResponse {
  matchId: string;
  rulesetVersion: "3";
  mode: "solo" | "pass_play" | "online";
  version: number;
  deadline: string | null;
  seat: v3.Seat | null;
  actingSeat: v3.Seat | null;
  botActing?: boolean;
  names: [string, string];
  view: v3.PlayerView;
  legal: v3.LegalCommand[];
  events: v3.GameEvent[];
}
