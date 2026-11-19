import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export type AuthState =
  | { mode: "preview" }
  | { mode: "live"; client: SupabaseClient; loading: boolean; session: Session | null };

export const AuthContext = createContext<AuthState>({ mode: "preview" });

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
