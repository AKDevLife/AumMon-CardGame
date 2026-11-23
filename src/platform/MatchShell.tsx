import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { StickerButton } from "../components/StickerButton.tsx";
import type { ClientGame } from "./games.ts";
import type { MatchResponse } from "./useMatch.ts";

/** Shared frame of a Game Center table: title, timer, errors, leave and end-of-match actions. */
export function MatchShell<V>({
  game,
  data,
  error,
  seconds,
  finished,
  onLeave,
  onRematch,
  children,
}: {
  game: ClientGame;
  data: MatchResponse<V> | null;
  error: string | null;
  seconds: number | null;
  finished: boolean;
  onLeave: () => Promise<void>;
  onRematch: () => Promise<string | null>;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const turn =
    data && data.acting !== null
      ? data.acting === data.seat
        ? "ตาคุณ"
        : `ตาของ ${data.names[data.acting] ?? "ผู้เล่น"}`
      : null;
  return (
    <section className="flex flex-col gap-4" aria-label={game.name}>
      <header className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">
          <span aria-hidden="true">{game.icon}</span> {game.name}
        </h1>
        <p role="timer" aria-live="off" className="font-display text-lg font-semibold">
          {turn}
          {seconds !== null && ` · ${String(seconds)} วิ`}
          {data?.botActing && " · Bot กำลังคิด…"}
        </p>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
        >
          {error}
        </p>
      )}
      {data ? children : <p className="text-center text-am-muted">กำลังโหลด…</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {finished && data?.mode === "solo" && (
          <StickerButton
            variant="confirm"
            onClick={() =>
              void onRematch().then((id) => {
                if (id) void navigate(game.matchPath(id), { replace: true });
              })
            }
          >
            เล่นอีกรอบ
          </StickerButton>
        )}
        {finished && data?.mode === "quick_match" && (
          <Link
            to={game.onlinePath}
            className="am-sticker am-pressable bg-am-title px-4 py-2 font-display font-semibold"
          >
            หาเกมใหม่
          </Link>
        )}
        {finished && data?.mode === "online" && (
          <Link
            to={`/lobby/${data.roomId}`}
            className="am-sticker am-pressable bg-am-title px-4 py-2 font-display font-semibold"
          >
            กลับห้อง
          </Link>
        )}
        {finished ? (
          <Link
            to="/"
            className="am-sticker am-pressable bg-am-card px-4 py-2 font-display font-semibold"
          >
            กลับหน้าหลัก
          </Link>
        ) : confirm ? (
          <StickerButton variant="danger" onClick={() => void onLeave().then(() => navigate("/"))}>
            ยืนยันออกจากเกม
          </StickerButton>
        ) : (
          <StickerButton
            onClick={() => {
              setConfirm(true);
            }}
          >
            ออกจากเกม
          </StickerButton>
        )}
      </div>
    </section>
  );
}
