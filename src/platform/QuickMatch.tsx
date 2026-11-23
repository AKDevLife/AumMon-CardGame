import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { StickerButton } from "../components/StickerButton.tsx";
import { useAuth } from "../features/auth/auth-context.ts";
import { ApiError, callFunction } from "../lib/api.ts";
import type { ClientGame } from "./games.ts";

interface QueueStatus {
  status: "idle" | "waiting" | "matched";
  waiting?: number;
  matchId?: string;
  waitedMs?: number;
}

/** Quick Match: the server pairs waiting players (bots fill the table after ~30 s). */
export function QuickMatch({ game }: { game: ClientGame }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const client = auth.mode === "live" ? auth.client : null;
  const [players, setPlayers] = useState(Math.min(4, game.maxPlayers));
  const [state, setState] = useState<QueueStatus>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback(
    (s: QueueStatus) => {
      setState(s);
      if (s.status === "matched" && s.matchId) void navigate(game.matchPath(s.matchId));
    },
    [game, navigate],
  );
  const call = async (body: Record<string, unknown>) => {
    if (!client) return;
    try {
      handle(await callFunction<QueueStatus>(client, "matchmaking", body));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "จับคู่ไม่สำเร็จ");
    }
  };

  const waiting = state.status === "waiting";
  useEffect(() => {
    if (!waiting || !client) return;
    const id = setInterval(() => {
      void callFunction<QueueStatus>(client, "matchmaking", { action: "status" })
        .then(handle)
        .catch((e: unknown) => {
          setError(e instanceof ApiError ? e.message : "จับคู่ไม่สำเร็จ");
        });
    }, 2000);
    return () => {
      clearInterval(id);
    };
  }, [waiting, client, handle]);

  return (
    <div className="am-sticker flex flex-col gap-3 bg-am-card p-4">
      <h2 className="font-display text-lg font-bold">Quick Match</h2>
      <p className="text-sm text-am-muted">
        ระบบจับคู่ผู้เล่นให้อัตโนมัติ — รอนานเกิน 30 วินาทีจะเติม Bot ให้ครบโต๊ะ
      </p>
      {waiting ? (
        <>
          <p role="status" className="font-semibold">
            กำลังหาผู้เล่น… {state.waiting ?? 1}/{players} คน
            {state.waitedMs !== undefined && ` · ${String(Math.floor(state.waitedMs / 1000))} วิ`}
          </p>
          <StickerButton
            onClick={() =>
              void call({ action: "cancel" }).then(() => {
                setState({ status: "idle" });
              })
            }
          >
            ยกเลิก
          </StickerButton>
        </>
      ) : (
        <>
          <label className="flex items-center gap-2 font-semibold">
            จำนวนผู้เล่น
            <select
              value={players}
              onChange={(e) => {
                setPlayers(Number(e.target.value));
              }}
              className="am-sticker bg-am-card px-2 py-1"
            >
              {Array.from(
                { length: game.maxPlayers - game.minPlayers + 1 },
                (_, i) => game.minPlayers + i,
              ).map((n) => (
                <option key={n} value={n}>
                  {n} คน
                </option>
              ))}
            </select>
          </label>
          <StickerButton
            variant="confirm"
            onClick={() => void call({ action: "join", gameId: game.id, players })}
          >
            หาเกมเลย
          </StickerButton>
        </>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
        >
          {error}
        </p>
      )}
    </div>
  );
}
