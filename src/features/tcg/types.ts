import type { v2 } from "@aummon/game-engine";

/** Response of the ruleset 2 Edge Functions (supabase/functions/_shared/tcg.ts). */
export interface TcgResponse {
  matchId: string;
  rulesetVersion: "2";
  mode: "solo" | "pass_play" | "online";
  version: number;
  deadline: string | null;
  seat: v2.Seat | null;
  actingSeat: v2.Seat | null;
  botActing?: boolean;
  names: [string, string];
  view: v2.PlayerView;
  legal: v2.LegalCommand[];
  events: v2.GameEvent[];
}
