import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/auth-context.ts";
import type { GameId } from "./games.ts";

/**
 * Enabled games from public.games (RLS returns enabled rows only). EDO Battle is assumed
 * available until the list loads and in preview mode, so the existing entry points never vanish.
 */
export function useEnabledGames(): ReadonlySet<GameId> {
  const auth = useAuth();
  const client = auth.mode === "live" && auth.session !== null ? auth.client : null;
  const [ids, setIds] = useState<ReadonlySet<GameId>>(new Set(["edo_battle"]));
  useEffect(() => {
    if (!client) return;
    let alive = true;
    void client
      .from("games")
      .select("id")
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error("games list failed", error.message);
          return;
        }
        setIds(new Set((data as { id: GameId }[]).map((g) => g.id)));
      });
    return () => {
      alive = false;
    };
  }, [client]);
  return ids;
}
