import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { TextField } from "../../components/TextField.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { CHARACTER_NAME } from "../game/labels.ts";
import { rememberJoinCode } from "./join-code-store.ts";

export function OnlinePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<string[]>([]);
  const [characterId, setCharacterId] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [code, setCode] = useState("");
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

  const run = async (fn: () => Promise<string>) => {
    setPending(true);
    setError(null);
    try {
      void navigate(`/lobby/${await fn()}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ไม่สำเร็จ");
      setPending(false);
    }
  };
  const create = () =>
    run(async () => {
      const r = await callFunction<{ roomId: string; joinCode: string }>(
        auth.client,
        "rooms-create",
        {
          mode: "online",
          characterId,
          maxPlayers,
        },
      );
      rememberJoinCode(r.roomId, r.joinCode);
      return r.roomId;
    });
  const join = () =>
    run(
      async () =>
        (
          await callFunction<{ roomId: string }>(auth.client, "rooms-join", {
            joinCode: code,
            characterId,
          })
        ).roomId,
    );

  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-bold">Online</h1>
      <div>
        <h2 className="mb-2 font-display text-lg font-semibold">ตัวละครของคุณ</h2>
        <div role="group" aria-label="Character" className="grid grid-cols-2 gap-2">
          {characters.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={characterId === id}
              onClick={() => {
                setCharacterId(id);
              }}
              className={`am-sticker am-pressable min-h-11 px-2 font-semibold ${characterId === id ? "bg-am-hover" : "bg-am-card"}`}
            >
              {CHARACTER_NAME[id] ?? id}
            </button>
          ))}
        </div>
      </div>
      <div className="am-sticker flex flex-col gap-3 bg-am-card p-4">
        <h2 className="font-display text-lg font-bold">สร้างห้อง</h2>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={maxPlayers === n}
              onClick={() => {
                setMaxPlayers(n);
              }}
              className={`am-sticker am-pressable min-h-11 flex-1 font-bold ${maxPlayers === n ? "bg-am-hover" : "bg-am-card"}`}
            >
              {n} คน
            </button>
          ))}
        </div>
        <StickerButton
          variant="confirm"
          disabled={!characterId || pending}
          onClick={() => void create()}
        >
          สร้างห้อง
        </StickerButton>
      </div>
      <div className="am-sticker flex flex-col gap-3 bg-am-card p-4">
        <h2 className="font-display text-lg font-bold">เข้าห้องด้วยรหัส</h2>
        <TextField
          label="รหัสห้อง"
          value={code}
          maxLength={12}
          autoCapitalize="characters"
          autoComplete="off"
          onChange={(e) => {
            setCode(e.target.value);
          }}
        />
        <StickerButton
          disabled={!characterId || code.trim().length < 8 || pending}
          onClick={() => void join()}
        >
          เข้าห้อง
        </StickerButton>
      </div>
      {error && (
        <p role="alert" className="font-semibold text-am-danger">
          {error}
        </p>
      )}
    </section>
  );
}
