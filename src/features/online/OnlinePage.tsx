import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { TextField } from "../../components/TextField.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";
import { rememberJoinCode } from "./join-code-store.ts";

export function OnlinePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
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
          })
        ).roomId,
    );

  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-bold">Online</h1>
      <div className="am-sticker flex flex-col gap-3 bg-am-card p-4">
        <h2 className="font-display text-lg font-bold">สร้างห้อง</h2>
        <p className="text-sm text-am-muted">ดวล 1 ต่อ 1 กับเพื่อน — ส่งรหัสห้องให้อีกคน</p>
        <StickerButton variant="confirm" disabled={pending} onClick={() => void create()}>
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
        <StickerButton disabled={code.trim().length < 8 || pending} onClick={() => void join()}>
          เข้าห้อง
        </StickerButton>
      </div>
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
