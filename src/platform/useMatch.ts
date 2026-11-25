import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../features/auth/auth-context.ts";
import { ApiError, callFunction } from "../lib/api.ts";

/** Generic game-* response (supabase/functions/_shared/game.ts GameResponse). */
export interface MatchResponse<V> {
  matchId: string;
  gameId: string;
  rulesetVersion: string;
  mode: "solo" | "online" | "quick_match";
  version: number;
  deadline: string | null;
  seat: number | null;
  acting: number | null;
  /** Seats that may still act (simultaneous games such as BLUFF). */
  pending?: number[];
  botActing: boolean;
  names: string[];
  view: V;
  events: { type: string }[];
  serverNow: number;
  autoSeats: number[];
  nextMatchId: string | null;
  roomId: string;
}

const POLL_MS = 2000;

/**
 * Platform match hook for Game Center games: polls game-view (which also advances bots and
 * timers on the server), listens to the private match channel, and sends intents with an
 * idempotency key. The server decides every result.
 */
export function useMatch<V>(matchId: string) {
  const auth = useAuth();
  const client = auth.mode === "live" ? auth.client : null;
  const [data, setData] = useState<MatchResponse<V> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const idem = useRef<{ key: string; body: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!client) return;
    try {
      const next = await callFunction<MatchResponse<V>>(client, "game-view", { matchId });
      setOffset(next.serverNow - Date.now());
      setData(next);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "โหลดเกมไม่สำเร็จ");
    }
  }, [client, matchId]);

  useEffect(() => {
    const first = setTimeout(() => void refresh(), 0);
    const id = setInterval(() => void refresh(), POLL_MS);
    const tick = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      clearInterval(tick);
    };
  }, [refresh]);

  const mode = data?.mode;
  useEffect(() => {
    if (!client || mode === undefined || mode === "solo") return;
    const channel = client
      .channel(`match:${matchId}`, { config: { private: true } })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        () => void refresh(),
      )
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) void refresh();
      });
    return () => {
      void client.removeChannel(channel);
    };
  }, [client, matchId, mode, refresh]);

  const send = useCallback(
    async (command: Record<string, unknown>) => {
      if (!client || !data) return;
      const body = JSON.stringify(command);
      // Same intent retried after a network error keeps its key (server-side idempotency).
      if (idem.current?.body !== body) idem.current = { key: crypto.randomUUID(), body };
      setBusy(true);
      try {
        const next = await callFunction<MatchResponse<V>>(client, "game-command", {
          matchId,
          expectedVersion: data.version,
          idempotencyKey: idem.current.key,
          command,
        });
        idem.current = null;
        setOffset(next.serverNow - Date.now());
        setData(next);
        setError(null);
      } catch (e) {
        if (e instanceof ApiError && e.status !== 0) idem.current = null;
        setError(e instanceof ApiError ? e.message : "ส่งคำสั่งไม่สำเร็จ");
        void refresh();
      } finally {
        setBusy(false);
      }
    },
    [client, data, matchId, refresh],
  );

  const leave = useCallback(async () => {
    if (!client) return;
    await callFunction(client, "game-leave", { matchId });
  }, [client, matchId]);

  /** Solo: a new match in the same room; returns the new match id. */
  const rematch = useCallback(async (): Promise<string | null> => {
    if (!client) return null;
    try {
      return (await callFunction<{ matchId: string }>(client, "game-rematch", { matchId })).matchId;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "เริ่มรอบใหม่ไม่สำเร็จ");
      return null;
    }
  }, [client, matchId]);

  const seconds =
    data?.deadline && !data.botActing
      ? Math.max(0, Math.ceil((Date.parse(data.deadline) - now - offset) / 1000))
      : null;
  return { data, error, busy, send, refresh, leave, rematch, seconds, live: client !== null };
}
