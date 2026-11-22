import { useState } from "react";
import { Link } from "react-router";
import { StickerButton } from "../components/StickerButton.tsx";
import { useAuth } from "../features/auth/auth-context.ts";
import { AudioSettings } from "../features/tcg/AudioSettings.tsx";
import { CardGallery } from "../features/tcg/CardGallery.tsx";
import { Popup } from "../features/tcg/Popup.tsx";
import { RulesText } from "../features/tcg/RulesText.tsx";

const MODES = [
  { id: "solo", label: "Solo vs Bot" },
  { id: "pass_play", label: "Pass & Play" },
  { id: "online", label: "Online" },
] as const;

export function HomePage() {
  const auth = useAuth();
  const signedIn = auth.mode === "live" && auth.session !== null;
  const [rules, setRules] = useState(false);
  const [cards, setCards] = useState(false);
  const [settings, setSettings] = useState(false);
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <section className="am-sticker relative overflow-hidden bg-am-brand px-6 py-6 text-center text-am-inverse">
        <span
          aria-hidden="true"
          className="absolute -left-6 -top-6 h-14 w-14 rounded-full bg-am-pink/50"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-8 -right-6 h-14 w-14 rounded-full bg-am-blue/40"
        />
        <h1 className="relative font-display text-5xl font-bold tracking-wide text-am-title">
          AumMon
        </h1>
        <p className="relative mt-2">การ์ดเกมดวล 1 ต่อ 1 · สิ่งของรอบตัวมีชีวิต</p>
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
              className="am-sticker am-pressable flex min-h-14 items-center justify-center bg-am-title px-6 py-3 font-display text-lg font-semibold text-am-text hover:bg-am-hover"
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

      {/* Secondary action: visually lighter than the play modes, always available (even signed out). */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setRules(true);
          }}
          className="am-pressable flex min-h-11 items-center gap-2 rounded-full border-[3px] border-am-ink bg-am-deco-purple px-5 py-2 font-display font-semibold"
        >
          <span aria-hidden="true">📖</span> วิธีเล่น &amp; กติกา
        </button>
        <button
          type="button"
          onClick={() => {
            setCards(true);
          }}
          className="am-pressable flex min-h-11 items-center gap-2 rounded-full border-[3px] border-am-ink bg-am-deco-purple px-5 py-2 font-display font-semibold"
        >
          <span aria-hidden="true">🗂️</span> การ์ดทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => {
            setSettings(true);
          }}
          className="am-pressable flex min-h-11 items-center gap-2 rounded-full border-[3px] border-am-ink bg-am-deco-purple px-5 py-2 font-display font-semibold"
        >
          <span aria-hidden="true">⚙️</span> ตั้งค่า
        </button>
      </div>

      <Popup
        title="ตั้งค่า"
        open={settings}
        onClose={() => {
          setSettings(false);
        }}
      >
        <AudioSettings />
      </Popup>

      <Popup
        title="การ์ดทั้งหมด"
        open={cards}
        onClose={() => {
          setCards(false);
        }}
      >
        <CardGallery />
      </Popup>

      <Popup
        title="วิธีเล่น & กติกา"
        open={rules}
        onClose={() => {
          setRules(false);
        }}
      >
        <RulesText />
        <StickerButton
          variant="confirm"
          onClick={() => {
            setRules(false);
          }}
        >
          เข้าใจแล้ว
        </StickerButton>
      </Popup>

      {!signedIn && (
        <Link
          to="/register"
          className="am-sticker am-pressable block bg-am-green px-6 py-3 text-center font-display text-lg font-semibold text-am-success-text"
        >
          สร้างบัญชี
        </Link>
      )}
    </div>
  );
}
