import { Link } from "react-router";
import { StickerButton } from "../components/StickerButton.tsx";
import { useAuth } from "../features/auth/auth-context.ts";

const MODES = [
  { id: "solo", label: "Solo vs Bot" },
  { id: "pass_play", label: "Pass & Play" },
  { id: "online", label: "Online" },
] as const;

export function HomePage() {
  const auth = useAuth();
  const signedIn = auth.mode === "live" && auth.session !== null;
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <section className="am-sticker bg-am-title px-6 py-6 text-center">
        <h1 className="font-display text-5xl font-bold tracking-wide">AumMon</h1>
        <p className="mt-2">การ์ดเกมดวล 1 ต่อ 1 · สิ่งของรอบตัวมีชีวิต</p>
      </section>

      <nav aria-label="Game modes" className="flex flex-col gap-4">
        {MODES.map((mode) =>
          signedIn ? (
            <Link
              key={mode.id}
              to={
                mode.id === "solo"
                  ? "/play/solo"
                  : mode.id === "pass_play"
                    ? "/play/pass"
                    : "/play/online"
              }
              className="am-sticker am-pressable flex min-h-14 items-center justify-center bg-am-card px-6 py-3 font-display text-lg font-semibold hover:bg-am-hover"
            >
              {mode.label}
            </Link>
          ) : (
            <StickerButton
              key={mode.id}
              disabled
              aria-describedby="modes-note"
              className="min-h-14"
            >
              {mode.label}
            </StickerButton>
          ),
        )}
        <p id="modes-note" className="text-center text-sm text-am-muted">
          {signedIn ? "เลือกโหมดที่ต้องการเล่น" : "ต้องเข้าสู่ระบบก่อนเริ่มเล่น"}
        </p>
      </nav>

      {!signedIn && (
        <Link
          to="/register"
          className="am-sticker am-pressable block bg-am-confirm px-6 py-3 text-center font-display text-lg font-semibold text-am-ink"
        >
          สร้างบัญชี
        </Link>
      )}
    </div>
  );
}
