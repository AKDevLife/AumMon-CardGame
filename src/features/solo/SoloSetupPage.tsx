import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";

export function SoloSetupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
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

  const start = async () => {
    setPending(true);
    setError(null);
    try {
      const { matchId } = await callFunction<{ matchId: string }>(auth.client, "tcg-create", {
        mode: "solo",
      });
      void navigate(`/game/${matchId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "เริ่มเกมไม่สำเร็จ");
      setPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-bold">Solo vs Bot</h1>
      <div className="am-sticker flex flex-col gap-2 bg-am-card p-4">
        <p>ดวล 1 ต่อ 1 กับ Bot ด้วยชุดการ์ดเริ่มต้น 30 ใบ</p>
        <ul className="list-disc pl-5 text-sm text-am-muted">
          <li>พลังชีวิตเริ่มต้น 20 · พลังงานเพิ่มทุกเทิร์น (สูงสุด 8)</li>
          <li>ลงตัวละคร ติดอุปกรณ์ พัฒนาร่าง และรวมร่าง แล้วค่อยโจมตี</li>
          <li>มีเวลา 90 วินาทีต่อเทิร์น</li>
        </ul>
      </div>
      {error && (
        <p role="alert" className="border-l-4 border-am-danger pl-2 font-semibold">
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
