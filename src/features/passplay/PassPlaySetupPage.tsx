import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { SharedDeviceNotice } from "./SharedDeviceNotice.tsx";

const NAME_RE = /^[\p{L}\p{M}\p{N} _.-]{1,24}$/u;

/** Pass & Play 1v1 (spec §1.2): two local seats on one device, no turn timer. */
export function PassPlaySetupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [names, setNames] = useState<[string, string]>(["ผู้เล่น 1", "ผู้เล่น 2"]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = auth.mode === "live" && auth.session !== null;

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

  const trimmed = names.map((n) => n.trim()) as [string, string];
  const valid = trimmed.every((n) => NAME_RE.test(n));

  const start = async () => {
    setPending(true);
    setError(null);
    try {
      const { matchId } = await callFunction<{ matchId: string }>(auth.client, "tcg-create", {
        mode: "pass_play",
        names: trimmed,
      });
      void navigate(`/game/${matchId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "เริ่มเกมไม่สำเร็จ");
      setPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-bold">Pass &amp; Play</h1>
      <SharedDeviceNotice />
      {names.map((name, i) => (
        <label
          key={i}
          className="am-sticker flex flex-col gap-1 bg-am-card p-3 text-sm font-semibold"
        >
          ชื่อผู้เล่น {i + 1}
          <input
            value={name}
            maxLength={24}
            onChange={(e) => {
              const next: [string, string] = [...names];
              next[i] = e.target.value;
              setNames(next);
            }}
            className="am-sticker min-h-11 bg-am-card px-3 text-base shadow-none"
          />
        </label>
      ))}
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
        disabled={!valid || pending}
        onClick={() => void start()}
        className="min-h-14"
      >
        {pending ? "กำลังเริ่มเกม…" : "เริ่มเกม"}
      </StickerButton>
    </section>
  );
}
