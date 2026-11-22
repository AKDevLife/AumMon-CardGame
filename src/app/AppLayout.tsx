import { ENGINE_VERSION } from "@aummon/game-engine";
import { useEffect } from "react";
import { Link, Outlet } from "react-router";
import { PreviewBanner } from "../components/PreviewBanner.tsx";
import { AccountNav } from "../features/auth/AccountNav.tsx";
import { useAuth } from "../features/auth/auth-context.ts";
import { installMusic } from "../features/game/music.ts";
import { installAudioUnlock, installTapSounds } from "../features/game/sound.ts";

export function AppLayout() {
  const auth = useAuth();
  // Every button in the app makes a tap sound; background music starts on the first tap.
  useEffect(() => installAudioUnlock(), []);
  useEffect(() => installTapSounds(), []);
  useEffect(() => installMusic(), []);
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {auth.mode === "preview" && <PreviewBanner />}
      <header className="flex items-center justify-between gap-3 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <Link to="/" className="font-display text-2xl font-bold">
          AumMon
        </Link>
        <AccountNav />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
      <footer className="px-4 py-4 text-center text-xs text-am-muted">
        <span className="rounded-full bg-am-round px-3 py-1 font-semibold text-am-ink">
          Discard Edition · 2–8 คน
        </span>{" "}
        · engine {ENGINE_VERSION} ·{" "}
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
