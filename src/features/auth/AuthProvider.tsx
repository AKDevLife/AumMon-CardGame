import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthState } from "./auth-context.ts";

interface AuthProviderProps {
  /** null = backend not configured (UI preview mode). */
  client: SupabaseClient | null;
  children: ReactNode;
}

export function AuthProvider({ client, children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(client !== null);

  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch((error: unknown) => {
        console.error("Failed to restore session", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthState>(
    () => (client ? { mode: "live", client, loading, session } : { mode: "preview" }),
    [client, loading, session],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
