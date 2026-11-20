import { ApiError } from "../../lib/api.ts";

/** UI state derived from the server's `me` answer. The server is the real gate. */
export type AdminGate = "loading" | "signed_out" | "forbidden" | "mfa" | "ok" | "error";

export function gateFromError(e: unknown): AdminGate {
  if (!(e instanceof ApiError)) return "error";
  if (e.status === 401) return "signed_out";
  if (e.code === "mfa_required") return "mfa";
  if (e.status === 403) return "forbidden";
  return "error";
}

export function gateFromMe(me: { aal: string }): AdminGate {
  return me.aal === "aal2" ? "ok" : "mfa";
}

export const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "players", label: "Players" },
  { id: "cards", label: "Cards" },
  { id: "decks", label: "Decks" },
  { id: "rooms", label: "Rooms" },
  { id: "matches", label: "Matches" },
  { id: "bots", label: "Bots" },
  { id: "logs", label: "Logs" },
  { id: "settings", label: "Settings" },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];
