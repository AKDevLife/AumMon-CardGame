import { useEffect } from "react";
import { Link, Outlet } from "react-router";
import { PreviewBanner } from "../../components/PreviewBanner.tsx";
import { useAuth } from "../auth/auth-context.ts";
import { installAudioUnlock, installTapSounds } from "../game/sound.ts";

/** v2 party frame: dark theme, BLUFF header, profile link (docs/v2/AumMon_UI_UX_Guidelines.md). */
export function PartyShell() {
  const auth = useAuth();
  useEffect(() => installAudioUnlock(), []);
  useEffect(() => installTapSounds(), []);
  const signedIn = auth.mode === "live" && auth.session !== null;
  return (
    <div className="theme-party flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {auth.mode === "preview" && (
        <div className="text-am-text">
          <PreviewBanner />
        </div>
      )}
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-bold text-party-accent">
          BLUFF
        </Link>
        {signedIn && (
          <Link
            to="/me"
            className="rounded-full border border-party-border px-3 py-1 text-sm text-party-muted"
          >
            👤 โปรไฟล์
          </Link>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-8">
        <Outlet />
      </main>
      <footer className="px-4 py-4 text-center text-xs text-party-muted">
        AumMon ·{" "}
        <Link to="/privacy" className="underline">
          ความเป็นส่วนตัว
        </Link>{" "}
        ·{" "}
        <Link to="/terms" className="underline">
          ข้อกำหนด
        </Link>
      </footer>
    </div>
  );
}
