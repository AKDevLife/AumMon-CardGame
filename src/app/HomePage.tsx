import { useState } from "react";
import { Link } from "react-router";
import { StickerButton } from "../components/StickerButton.tsx";
import { useAuth } from "../features/auth/auth-context.ts";
import { CardGallery } from "../features/game/CardGallery.tsx";
import { Popup } from "../features/game/Popup.tsx";
import { RulesText } from "../features/game/RulesText.tsx";

const MODES = [
  { id: "solo", label: "Solo vs Bot" },
  { id: "online", label: "Online" },
] as const;

/** The tutorial is highlighted until it was finished once on this device. */
function tutorialDone(): boolean {
  try {
    return localStorage.getItem("aummon.tutorialDone") === "1";
  } catch {
    return false;
  }
}

export function HomePage() {
  const auth = useAuth();
  const signedIn = auth.mode === "live" && auth.session !== null;
  const [rules, setRules] = useState(false);
  const [cards, setCards] = useState(false);
  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <section aria-labelledby="edo-title" className="flex flex-col gap-4">
        <div className="text-center">
          <h1 id="edo-title" className="font-display text-3xl font-bold">
            🧸 AumMon Object Battle Card
          </h1>
          <p className="text-sm text-am-muted">เกมไพ่ทิ้งให้หมดมือ 2–8 คน · สิ่งของรอบตัวมีชีวิต</p>
        </div>
        <nav aria-label="Game modes" className="flex flex-col gap-4">
          {MODES.map((mode) =>
            signedIn ? (
              <Link
                key={mode.id}
                to={mode.id === "solo" ? "/play/solo" : "/play/online"}
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
          <Link
            to="/tutorial"
            className={`am-pressable flex min-h-11 items-center gap-2 rounded-full border-[3px] border-am-ink px-5 py-2 font-display font-semibold ${tutorialDone() ? "bg-am-deco-purple" : "am-active bg-am-green text-am-success-text"}`}
          >
            <span aria-hidden="true">🎓</span> ฝึกเล่น (1 นาที)
          </Link>
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
        </div>
      </section>

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
