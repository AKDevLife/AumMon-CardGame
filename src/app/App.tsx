import { ENGINE_VERSION, RULESET_VERSION } from "@aummon/game-engine";
import { StickerButton } from "../components/StickerButton.tsx";

const MODES = [
  { id: "solo", label: "Solo vs Bots" },
  { id: "pass_play", label: "Pass & Play" },
  { id: "online", label: "Online" },
] as const;

export function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-8 px-4 py-10">
      <header className="am-sticker w-full bg-am-title px-6 py-5 text-center">
        <h1 className="font-display text-5xl font-bold tracking-wide">AumMon</h1>
        <p className="mt-1 text-am-muted">Multiplayer card battle · Last Survivor · 2–4 ผู้เล่น</p>
      </header>

      <nav aria-label="Game modes" className="flex w-full flex-col gap-4">
        {MODES.map((mode) => (
          <StickerButton key={mode.id} disabled aria-describedby="coming-soon">
            {mode.label}
          </StickerButton>
        ))}
        <p id="coming-soon" className="text-center text-sm text-am-muted">
          กำลังพัฒนา — ต้องเข้าสู่ระบบก่อนเริ่มเล่น (Phase 2+)
        </p>
      </nav>

      <footer className="text-xs text-am-muted">
        <span className="rounded-full bg-am-round px-3 py-1 font-semibold text-white">
          Rulebook v{RULESET_VERSION}
        </span>{" "}
        · engine {ENGINE_VERSION}
      </footer>
    </main>
  );
}
