import { Link } from "react-router";
import { StickerButton } from "../components/StickerButton.tsx";

const MODES = [
  { id: "solo", label: "Solo vs Bots" },
  { id: "pass_play", label: "Pass & Play" },
  { id: "online", label: "Online" },
] as const;

export function HomePage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <section className="am-sticker bg-am-title px-6 py-6 text-center">
        <h1 className="font-display text-5xl font-bold tracking-wide">AumMon</h1>
        <p className="mt-2 text-am-muted">Multiplayer card battle · Last Survivor · 2–4 ผู้เล่น</p>
      </section>

      <nav aria-label="Game modes" className="flex flex-col gap-4">
        {MODES.map((mode) => (
          <StickerButton key={mode.id} disabled aria-describedby="modes-note" className="min-h-14">
            {mode.label}
          </StickerButton>
        ))}
        <p id="modes-note" className="text-center text-sm text-am-muted">
          โหมดเกมยังไม่เปิด — ต้องเข้าสู่ระบบก่อนเริ่มเล่น
        </p>
      </nav>

      <Link
        to="/register"
        className="am-sticker am-pressable block bg-am-confirm px-6 py-3 text-center font-display text-lg font-semibold text-white"
      >
        สร้างบัญชี
      </Link>
    </div>
  );
}
