import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { recallJoinCode } from "./join-code-store.ts";

interface Seat {
  seat: number;
  user_id: string | null;
  display_name_snapshot: string;
  status: string;
}

interface Room {
  owner_id: string;
  status: string;
  max_players: number;
}

const POLL_MS = 3000;

export function LobbyPage() {
  const { roomId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const client = auth.mode === "live" ? auth.client : null;
  const userId = auth.mode === "live" ? auth.session?.user.id : undefined;
  const code = recallJoinCode(roomId);

  const load = useCallback(async () => {
    if (!client) return;
    const [r, s, m] = await Promise.all([
      client
        .from("game_rooms")
        .select("owner_id, status, max_players")
        .eq("id", roomId)
        .maybeSingle<Room>(),
      client
        .from("room_players")
        .select("seat, user_id, display_name_snapshot, status")
        .eq("room_id", roomId)
        .order("seat")
        .overrideTypes<Seat[], { merge: false }>(),
      client
        .from("matches")
        .select("id")
        .eq("room_id", roomId)
        .limit(1)
        .overrideTypes<{ id: string }[], { merge: false }>(),
    ]);
    if (r.error || s.error) {
      setError("โหลดห้องไม่สำเร็จ");
      return;
    }
    const matchId = m.data?.[0]?.id;
    if (matchId) {
      void navigate(`/game/${matchId}`);
      return;
    }
    setRoom(r.data);
    setSeats(s.data);
  }, [client, roomId, navigate]);

  useEffect(() => {
    if (!client) return;
    const first = setTimeout(() => void load(), 0);
    const poll = setInterval(() => void load(), POLL_MS);
    // Realtime (RLS-filtered): refresh when seats or room status change.
    const channel = client
      .channel(`lobby-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => {
          void load();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      clearTimeout(first);
      clearInterval(poll);
      void client.removeChannel(channel);
    };
  }, [client, roomId, load]);

  if (!client) return <p className="text-center text-am-muted">ต้องเชื่อมระบบก่อนเล่น (Preview)</p>;
  if (!room) return <p className="text-center text-am-muted">{error ?? "กำลังโหลด…"}</p>;
  if (room.status === "closed") return <p className="text-center">ห้องนี้ถูกปิดแล้ว</p>;

  const isOwner = room.owner_id === userId;
  const mine = seats.find((s) => s.user_id === userId);
  const canStart = isOwner && seats.length >= 2 && seats.every((s) => s.status === "ready");

  const act = async (fn: string, body: Record<string, unknown>, after?: () => void) => {
    setPending(true);
    setError(null);
    try {
      await callFunction(client, fn, body);
      after?.();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-bold">ห้องรอเล่น</h1>
      {isOwner && code && (
        <div className="am-sticker bg-am-title p-4 text-center">
          <p className="text-sm">ส่งรหัสนี้ให้เพื่อน (หมดอายุใน 30 นาที)</p>
          <p className="font-display text-4xl font-bold tracking-[0.2em]" aria-label="Join code">
            {code}
          </p>
        </div>
      )}
      <ul className="flex flex-col gap-2" aria-label="Lobby players">
        {seats.map((s) => (
          <li key={s.seat} className="am-sticker flex items-center justify-between bg-am-card p-3">
            <span className="font-semibold">{s.display_name_snapshot}</span>
            <span className={s.status === "ready" ? "text-am-confirm" : "text-am-muted"}>
              {s.status === "ready" ? "พร้อม ✅" : "รอ…"}
            </span>
          </li>
        ))}
        {Array.from({ length: Math.max(0, room.max_players - seats.length) }, (_, i) => (
          <li key={`empty-${i}`} className="am-sticker bg-am-deco-purple p-3 text-am-muted">
            ว่าง
          </li>
        ))}
      </ul>
      {mine && !isOwner && (
        <StickerButton
          variant={mine.status === "ready" ? "default" : "confirm"}
          disabled={pending}
          onClick={() => void act("rooms-ready", { roomId, ready: mine.status !== "ready" })}
        >
          {mine.status === "ready" ? "ยกเลิกพร้อม" : "พร้อมเล่น"}
        </StickerButton>
      )}
      {isOwner && (
        <StickerButton
          variant="confirm"
          disabled={!canStart || pending}
          onClick={() => void act("tcg-start", { roomId })}
        >
          เริ่มเกม
        </StickerButton>
      )}
      <StickerButton
        variant="danger"
        disabled={pending}
        onClick={() =>
          void act("rooms-leave", { roomId }, () => {
            void navigate("/play/online");
          })
        }
      >
        {isOwner ? "ปิดห้อง" : "ออกจากห้อง"}
      </StickerButton>
      {error && (
        <p
          role="alert"
          className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
        >
          {error}
        </p>
      )}
    </section>
  );
}
