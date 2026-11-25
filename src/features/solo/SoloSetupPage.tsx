import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { discard } from "@aummon/game-engine";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { gameById } from "../../platform/games.ts";
import { useAuth } from "../auth/auth-context.ts";

export function SoloSetupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { gameId = "edo_battle" } = useParams();
  const game = gameById(gameId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bots, setBots] = useState(Math.min(3, (game?.maxPlayers ?? 4) - 1));
  const signedIn = auth.mode === "live" && auth.session !== null;

  if (!game) return <p className="text-center">ไม่พบเกมนี้</p>;
  if (auth.mode !== "live")
    return <p className="text-center text-am-muted">ต้องเชื่อมระบบก่อนเล่น (Preview)</p>;
  if (!signedIn) {
    return (
      <p className="text-center">
        กรุณา{" "}
        <Link to="/login" className="font-semibold text-am-accent underline">
          เข้าสู่ระบบ
        </Link>{" "}
        ก่อนเล่น
      </p>
    );
  }

  const start = async () => {
    setPending(true);
    setError(null);
    try {
      const { matchId } = await callFunction<{ matchId: string }>(auth.client, "game-create", {
        mode: "solo",
        bots,
        gameId: game.id,
      });
      void navigate(game.matchPath(matchId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "เริ่มเกมไม่สำเร็จ");
      setPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-bold">Solo vs Bot</h1>
      <p className="-mt-4 font-semibold text-am-muted">{game.name}</p>
      <div className="am-sticker flex flex-col gap-2 bg-am-card p-4">
        <p>เล่นกับ Bot — ทิ้งไพ่ในมือให้หมดก่อนเป็นผู้ชนะ</p>
        <label className="flex items-center gap-2 font-semibold">
          จำนวน Bot
          <select
            value={bots}
            onChange={(e) => {
              setBots(Number(e.target.value));
            }}
            className="am-sticker bg-am-card px-2 py-1"
          >
            {Array.from({ length: game.maxPlayers - 1 }, (_, i) => i + 1)
              .filter((n) => n + 1 >= game.minPlayers)
              .map((n) => (
                <option key={n} value={n}>
                  {n} ตัว (รวมคุณ {n + 1} คน)
                </option>
              ))}
          </select>
        </label>
        <p className="text-sm text-am-muted">
          เทิร์นละ {discard.DISCARD_RULES.turnTimeoutMs / 1000} วินาที · 2–4 คนได้ไพ่คนละ 7 ใบ · 5–8
          คนได้คนละ 5 ใบ
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
        >
          {error}
        </p>
      )}
      <StickerButton
        variant="confirm"
        disabled={pending}
        onClick={() => void start()}
        className="min-h-14"
      >
        {pending ? "กำลังเริ่มเกม…" : "เริ่มเกม"}
      </StickerButton>
    </section>
  );
}
