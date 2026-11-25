import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { ensurePlayer, savedNickname, validNickname } from "./guest.ts";
import { normalizeJoinCode } from "./join.ts";
import { alertBox, field, friendly, primary } from "./ui.ts";

/** Join by link (/join/CODE): nickname, then straight into the lobby. */
export function PartyJoin() {
  const { code = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const [nick, setNick] = useState(savedNickname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinCode = normalizeJoinCode(code);

  const join = async () => {
    if (auth.mode !== "live") return;
    if (!validNickname(nick)) {
      setError("ชื่อเล่น 2–24 ตัวอักษร");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensurePlayer(auth.client, auth.session, nick);
      const joined = await callFunction<{ roomId: string }>(auth.client, "rooms-join", {
        joinCode,
      });
      void navigate(`/party/lobby/${joined.roomId}`, { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? friendly(e.code, e.message) : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 py-6">
      <h1 className="text-center text-3xl font-bold">เพื่อนชวนเล่น BLUFF</h1>
      <p className="text-center text-party-muted">
        ห้อง <b className="tracking-widest text-party-accent">{joinCode}</b>
      </p>
      <label className="flex flex-col gap-1">
        <span>ชื่อเล่น</span>
        <input
          value={nick}
          maxLength={24}
          onChange={(e) => {
            setNick(e.target.value);
          }}
          className={field}
        />
      </label>
      <button
        type="button"
        className={primary}
        disabled={auth.mode !== "live" || busy}
        onClick={() => void join()}
      >
        เข้าห้อง
      </button>
      {error && (
        <p role="alert" className={alertBox}>
          {error}
        </p>
      )}
    </section>
  );
}
