import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { recallJoinCode } from "../online/join-code-store.ts";
import { joinLink } from "./join.ts";
import { alertBox, friendly, panel, primary, secondary } from "./ui.ts";

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
  game_id: string;
  settings: { slow?: boolean; humor?: number; group?: boolean };
}

const POLL_MS = 3000;

/** Lobby (R2): code + share link, ready chips, host settings visible to all, host starts. */
export function PartyLobby() {
  const { roomId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const client = auth.mode === "live" ? auth.client : null;
  const userId = auth.mode === "live" ? auth.session?.user.id : undefined;
  const code = recallJoinCode(roomId);

  const load = useCallback(async () => {
    if (!client) return;
    const [r, s, m] = await Promise.all([
      client
        .from("game_rooms")
        .select("owner_id, status, max_players, game_id, settings")
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
        .eq("status", "active")
        .limit(1)
        .overrideTypes<{ id: string }[], { merge: false }>(),
    ]);
    if (r.error || s.error) {
      setError("โหลดห้องไม่สำเร็จ");
      return;
    }
    const matchId = m.data?.[0]?.id;
    if (matchId) {
      void navigate(`/party/game/${matchId}`);
      return;
    }
    setRoom(r.data);
    setSeats(s.data.filter((x) => x.status !== "left"));
  }, [client, roomId, navigate]);

  useEffect(() => {
    if (!client) return;
    const first = setTimeout(() => void load(), 0);
    const poll = setInterval(() => void load(), POLL_MS);
    const channel = client
      .channel(`room:${roomId}`, { config: { private: true } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      clearTimeout(first);
      clearInterval(poll);
      void client.removeChannel(channel);
    };
  }, [client, roomId, load]);

  if (!client) return <p className="text-center text-party-muted">ยังไม่เชื่อมระบบจริง (Preview)</p>;
  if (!room) return <p className="text-center text-party-muted">{error ?? "กำลังโหลด…"}</p>;
  if (room.status === "closed") return <p className="text-center">ห้องนี้ปิดแล้ว</p>;

  const isHost = room.owner_id === userId;
  const mine = seats.find((s) => s.user_id === userId);
  const notReady = seats.filter((s) => s.status !== "ready").length;
  const canStart = isHost && notReady === 0;
  const bots = Math.max(0, room.max_players - seats.length);
  const link = code ? joinLink(code) : null;

  const act = async (fn: string, body: Record<string, unknown>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await callFunction(client, fn, body);
      after?.();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? friendly(e.code, e.message) : "ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!link) return;
    const text = `มาเล่น AumMon BLUFF กัน! โค้ด ${code ?? ""}`;
    try {
      if (typeof navigator.share === "function")
        await navigator.share({ title: "AumMon BLUFF", text, url: link });
      else {
        await navigator.clipboard.writeText(`${text} ${link}`);
        setCopied(true);
      }
    } catch {
      // share sheet closed by the player
    }
  };

  const s = room.settings;
  return (
    <>
      <section className={`${panel} text-center`}>
        <p className="text-party-muted">โค้ดห้อง</p>
        {code ? (
          <p
            className="text-4xl font-bold tracking-widest text-party-accent"
            aria-label="Join code"
          >
            {code}
          </p>
        ) : (
          <p className="text-sm text-party-muted">เจ้าของห้องเป็นคนแชร์โค้ด</p>
        )}
        <p className="text-sm text-party-muted">
          {seats.length} / {room.max_players} คน · หมดอายุใน 30 นาที
        </p>
        {link && (
          <button type="button" className={`${secondary} mt-3`} onClick={() => void share()}>
            {copied ? "คัดลอกลิงก์แล้ว ✓" : "แชร์ลิงก์ให้เพื่อน"}
          </button>
        )}
      </section>
      <p className="text-center text-sm text-party-muted" aria-label="ตั้งค่าห้อง">
        ตั้งค่า: {s.slow === true ? "เวลาช้า ×1.5" : "เวลาปกติ"} · ระดับแซว {s.humor ?? 2} · คำถามกลุ่ม{" "}
        {s.group === true ? "เปิด" : "ปิด"}
      </p>
      <ul className="grid grid-cols-2 gap-2" aria-label="ผู้เล่น">
        {seats.map((p) => (
          <li key={p.seat} className={`${panel} py-2`}>
            <span className="font-semibold">{p.display_name_snapshot}</span>{" "}
            {p.user_id === room.owner_id && <span aria-label="เจ้าของห้อง">👑</span>}
            <span
              className={`block text-sm ${p.status === "ready" ? "text-party-green" : "text-party-muted"}`}
            >
              {p.status === "ready" ? "✓ พร้อม" : "รอ…"}
            </span>
          </li>
        ))}
        {Array.from({ length: bots }, (_, i) => (
          <li key={`bot-${String(i)}`} className={`${panel} py-2 text-party-muted`}>
            ว่าง · 🤖 Bot เล่นแทน
          </li>
        ))}
      </ul>
      <p role="status" className="text-center">
        {notReady > 0
          ? `รออีก ${String(notReady)} คนกดพร้อม`
          : bots > 0
            ? `พร้อมแล้ว! เริ่มได้เลย ที่ว่าง ${String(bots)} ที่จะเป็น Bot`
            : "พร้อมครบแล้ว!"}
      </p>
      {mine && !isHost && (
        <button
          type="button"
          className={mine.status === "ready" ? secondary : primary}
          disabled={busy}
          onClick={() => void act("rooms-ready", { roomId, ready: mine.status !== "ready" })}
        >
          {mine.status === "ready" ? "ยกเลิกพร้อม" : "พร้อมเล่น"}
        </button>
      )}
      {isHost && (
        <button
          type="button"
          className={primary}
          disabled={!canStart || busy}
          onClick={() => void act("game-start", { roomId })}
        >
          เริ่มเกม
        </button>
      )}
      <button
        type="button"
        className={secondary}
        disabled={busy}
        onClick={() =>
          void act("rooms-leave", { roomId }, () => {
            void navigate("/");
          })
        }
      >
        {isHost ? "ปิดห้อง" : "ออกจากห้อง"}
      </button>
      {error && (
        <p role="alert" className={alertBox}>
          {error}
        </p>
      )}
    </>
  );
}
