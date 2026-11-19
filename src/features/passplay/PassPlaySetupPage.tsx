import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { CHARACTER_NAME } from "../game/labels.ts";
import type { MatchResponse } from "../game/types.ts";
import { SharedDeviceNotice } from "./SharedDeviceNotice.tsx";

interface Seat {
  displayName: string;
  characterId: string;
}

const NAME_RE = /^[\p{L}\p{M}\p{N} _.-]{1,24}$/u;

export function PassPlaySetupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([
    { displayName: "ผู้เล่น 1", characterId: "" },
    { displayName: "ผู้เล่น 2", characterId: "" },
  ]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = auth.mode === "live" && auth.session !== null;

  useEffect(() => {
    if (auth.mode !== "live" || !signedIn) return;
    void auth.client
      .from("characters")
      .select("id")
      .order("speed", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (loadError) setError("โหลดตัวละครไม่สำเร็จ");
        else setCharacters(data.map((c: { id: string }) => c.id));
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

  const update = (i: number, patch: Partial<Seat>) => {
    setSeats(seats.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  };
  const taken = new Set(seats.map((s) => s.characterId).filter(Boolean));
  const valid =
    seats.every((s) => NAME_RE.test(s.displayName.trim()) && s.characterId) &&
    taken.size === seats.length;

  const start = async () => {
    setPending(true);
    setError(null);
    try {
      const { roomId } = await callFunction<{ roomId: string }>(auth.client, "rooms-create", {
        mode: "pass_play",
        seats: seats.map((s) => ({ ...s, displayName: s.displayName.trim() })),
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
      <h1 className="font-display text-3xl font-bold">Pass &amp; Play</h1>
      <SharedDeviceNotice />
      <div className="flex gap-3">
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={seats.length === n}
            onClick={() => {
              setSeats(
                Array.from(
                  { length: n },
                  (_, i) => seats[i] ?? { displayName: `ผู้เล่น ${i + 1}`, characterId: "" },
                ),
              );
            }}
            className={`am-sticker am-pressable min-h-12 flex-1 font-display font-bold ${seats.length === n ? "bg-am-hover" : "bg-am-card"}`}
          >
            {n} คน
          </button>
        ))}
      </div>
      {seats.map((seat, i) => (
        <fieldset key={i} className="am-sticker flex flex-col gap-2 bg-am-card p-3">
          <legend className="px-1 font-display font-bold">ที่นั่ง {i + 1}</legend>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            ชื่อ
            <input
              value={seat.displayName}
              maxLength={24}
              onChange={(e) => {
                update(i, { displayName: e.target.value });
              }}
              className="am-sticker min-h-11 bg-am-card px-3 text-base shadow-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={`ตัวละครที่นั่ง ${i + 1}`}>
            {characters.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={seat.characterId === id}
                disabled={taken.has(id) && seat.characterId !== id}
                onClick={() => {
                  update(i, { characterId: id });
                }}
                className={`am-sticker am-pressable min-h-11 px-2 text-sm font-semibold disabled:opacity-40 ${seat.characterId === id ? "bg-am-hover" : "bg-am-card"}`}
              >
                {CHARACTER_NAME[id] ?? id}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {error && (
        <p role="alert" className="font-semibold text-am-danger">
          {error}
        </p>
      )}
      <StickerButton
        variant="confirm"
        disabled={!valid || pending}
        onClick={() => void start()}
        className="min-h-14"
      >
        {pending ? "กำลังเริ่มเกม…" : "เริ่มเกม"}
      </StickerButton>
    </section>
  );
}
