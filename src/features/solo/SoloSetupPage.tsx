import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import type { MatchResponse } from "../game/types.ts";

interface CharacterRow {
  id: string;
  name: string;
  element: string;
  base_hp: number;
  speed: number;
  description: string;
}

export function SoloSetupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [characterId, setCharacterId] = useState<string>("");
  const [bots, setBots] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = auth.mode === "live" && auth.session !== null;

  useEffect(() => {
    if (auth.mode !== "live" || !signedIn) return;
    void auth.client
      .from("characters")
      .select("id, name, element, base_hp, speed, description")
      .order("speed", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (loadError) setError("โหลดตัวละครไม่สำเร็จ");
        else setCharacters(data);
      });
  }, [auth, signedIn]);

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
      const { roomId } = await callFunction<{ roomId: string }>(auth.client, "rooms-create", {
        mode: "solo",
        characterId,
        botCount: bots,
      });
      const { matchId } = await callFunction<MatchResponse & { matchId: string }>(
        auth.client,
        "matches-start",
        { roomId },
      );
      void navigate(`/match/${matchId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "เริ่มเกมไม่สำเร็จ");
      setPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-bold">Solo vs Bots</h1>
      <div>
        <h2 className="mb-2 font-display text-lg font-semibold">เลือกตัวละคร</h2>
        <div className="grid grid-cols-2 gap-3">
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={characterId === c.id}
              onClick={() => {
                setCharacterId(c.id);
              }}
              className={`am-sticker am-pressable flex flex-col gap-1 p-3 text-left ${characterId === c.id ? "bg-am-hover" : "bg-am-card"}`}
            >
              <span className="font-display font-bold">{c.name}</span>
              <span className="text-xs text-am-muted">
                HP {c.base_hp} · Speed {c.speed} · {c.element}
              </span>
              <span className="text-xs">{c.description}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-2 font-display text-lg font-semibold">จำนวน Bot</h2>
        <div className="flex gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={bots === n}
              onClick={() => {
                setBots(n);
              }}
              className={`am-sticker am-pressable min-h-12 flex-1 font-display font-bold ${bots === n ? "bg-am-hover" : "bg-am-card"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="font-semibold text-am-danger">
          {error}
        </p>
      )}
      <StickerButton
        variant="confirm"
        disabled={!characterId || pending}
        onClick={() => void start()}
        className="min-h-14"
      >
        {pending ? "กำลังเริ่มเกม…" : "เริ่มเกม"}
      </StickerButton>
    </section>
  );
}
