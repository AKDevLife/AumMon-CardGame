import { ENGINE_VERSION } from "@aummon/game-engine";
import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { PreviewBanner } from "../components/PreviewBanner.tsx";
import { AccountNav } from "../features/auth/AccountNav.tsx";
import { useAuth } from "../features/auth/auth-context.ts";
import { installMusic } from "../features/game/music.ts";
import { installAudioUnlock, installTapSounds } from "../features/game/sound.ts";

/** Game name shown next to the AumMon logo (brand architecture: master brand first). */
function gameLabel(pathname: string): string | null {
  if (/^\/(bluff|join|party)(\/|$)/.test(pathname)) return "BLUFF";
  if (/^\/(edo|play|game|games|lobby|tutorial)(\/|$)/.test(pathname)) return "Object Battle Card";
  return null;
}

/** One shell for the whole platform (owner 2026-11-27): dark theme, AumMon header, settings top right. */
export function AppLayout() {
  const auth = useAuth();
  const { pathname } = useLocation();
  const game = gameLabel(pathname);
  // Every button in the app makes a tap sound; background music starts on the first tap.
  useEffect(() => installAudioUnlock(), []);
  useEffect(() => installTapSounds(), []);
  useEffect(() => installMusic(), []);
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {auth.mode === "preview" && <PreviewBanner />}
      <header className="flex flex-wrap items-center justify-between gap-3 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <Link to="/" className="flex flex-col font-display text-2xl font-bold leading-tight">
          <span className="text-am-title">AumMon</span>
          {game && (
            <span className="whitespace-nowrap text-sm font-semibold text-am-muted">{game}</span>
          )}
        </Link>
        <AccountNav />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
      <footer className="px-4 py-4 text-center text-xs text-am-muted">
        <span className="rounded-full bg-am-round px-3 py-1 font-semibold text-am-ink">AumMon</span>{" "}
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
