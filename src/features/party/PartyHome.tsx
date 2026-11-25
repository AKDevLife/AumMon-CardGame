import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { normalizeJoinCode } from "./join.ts";
import { rememberJoinCode } from "../online/join-code-store.ts";
import { ensurePlayer, savedNickname, validNickname } from "./guest.ts";
import { alertBox, field, friendly, panel, primary, secondary } from "./ui.ts";

/** v2 Home (R1, R2): nickname → create a BLUFF room or join with a code. No e-mail needed. */
export function PartyHome() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [nick, setNick] = useState(savedNickname);
  const [code, setCode] = useState("");
  const [slow, setSlow] = useState(false);
  const [humor, setHumor] = useState<1 | 2>(2);
  const [group, setGroup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = auth.mode === "live";

  const run = async (action: "create" | "join") => {
    if (auth.mode !== "live") return;
    if (!validNickname(nick)) {
      setError("ชื่อเล่น 2–24 ตัวอักษร");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensurePlayer(auth.client, auth.session, nick);
      if (action === "create") {
        const room = await callFunction<{ roomId: string; joinCode: string }>(
          auth.client,
          "rooms-create",
          { mode: "online", gameId: "bluff", maxPlayers: 8, settings: { slow, humor, group } },
        );
        rememberJoinCode(room.roomId, room.joinCode);
        void navigate(`/party/lobby/${room.roomId}`);
      } else {
        const joined = await callFunction<{ roomId: string }>(auth.client, "rooms-join", {
          joinCode: normalizeJoinCode(code),
        });
        void navigate(`/party/lobby/${joined.roomId}`);
      }
    } catch (e) {
      setError(e instanceof ApiError ? friendly(e.code, e.message) : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="flex flex-col gap-2 py-4 text-center">
        <h1 className="text-5xl font-bold">AumMon</h1>
        <p className="text-party-muted">Say Less. Bluff More. Troll Your Friends.</p>
      </section>
      <label className="flex flex-col gap-1">
        <span>ชื่อเล่น</span>
        <input
          value={nick}
          maxLength={24}
          autoComplete="nickname"
          onChange={(e) => {
            setNick(e.target.value);
          }}
          className={field}
        />
      </label>

      <section className={`${panel} flex flex-col gap-3`} aria-label="สร้างห้อง">
        <h2 className="text-lg font-bold">สร้างห้อง BLUFF (2–8 คน)</h2>
        <label className="flex items-center justify-between gap-2">
          <span>เวลาช้า ×1.5</span>
          <input
            type="checkbox"
            className="h-6 w-6"
            checked={slow}
            onChange={(e) => {
              setSlow(e.target.checked);
            }}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>คำถามแซวได้ (ระดับ 2)</span>
          <input
            type="checkbox"
            className="h-6 w-6"
            checked={humor === 2}
            onChange={(e) => {
              setHumor(e.target.checked ? 2 : 1);
            }}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>คำถามถึงคนในห้อง (3 คนขึ้นไป)</span>
          <input
            type="checkbox"
            className="h-6 w-6"
            checked={group}
            onChange={(e) => {
              setGroup(e.target.checked);
            }}
          />
        </label>
        <button
          type="button"
          className={primary}
          disabled={!live || busy}
          onClick={() => void run("create")}
        >
          สร้างห้อง
        </button>
      </section>

      <section className={`${panel} flex flex-col gap-3`} aria-label="เข้าห้อง">
        <label className="flex flex-col gap-1">
          <span>โค้ดห้อง</span>
          <input
            value={code}
            maxLength={12}
            autoCapitalize="characters"
            onChange={(e) => {
              setCode(e.target.value);
            }}
            className={`${field} uppercase tracking-widest`}
          />
        </label>
        <button
          type="button"
          className={secondary}
          disabled={!live || busy || normalizeJoinCode(code).length !== 8}
          onClick={() => void run("join")}
        >
          เข้าห้องด้วยโค้ด
        </button>
      </section>
      {!live && <p className="text-center text-party-muted">ยังไม่เชื่อมระบบจริง (Preview)</p>}
      {error && (
        <p role="alert" className={alertBox}>
          {error}
        </p>
      )}
    </>
  );
}
