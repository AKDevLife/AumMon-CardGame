import { useEffect, useState } from "react";
import { GAMES } from "../../platform/games.ts";
import { useAuth } from "../auth/auth-context.ts";

interface Row {
  game_id: string;
  played: number;
  won: number;
}

/** Per-game results (public.player_game_stats, own rows only via RLS). */
export function GameStats() {
  const auth = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const client = auth.mode === "live" ? auth.client : null;
  useEffect(() => {
    if (!client) return;
    let alive = true;
    void client
      .from("player_game_stats")
      .select("game_id, played, won")
      .overrideTypes<Row[], { merge: false }>()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.error("stats load failed", error.message);
          setRows([]);
          return;
        }
        setRows(data);
      });
    return () => {
      alive = false;
    };
  }, [client]);
  if (rows === null) return null;
  return (
    <section
      aria-labelledby="stats-title"
      className="am-sticker flex flex-col gap-2 bg-am-card p-4"
    >
      <h2 id="stats-title" className="font-display text-lg font-bold">
        สถิติการเล่น
      </h2>
      <ul className="flex flex-col gap-1">
        {GAMES.map((g) => {
          const r = rows.find((x) => x.game_id === g.id);
          return (
            <li key={g.id}>
              <span aria-hidden="true">{g.icon}</span> {g.name}: เล่น {r?.played ?? 0} · ชนะ{" "}
              {r?.won ?? 0}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
