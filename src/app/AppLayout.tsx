import { ENGINE_VERSION, RULESET_VERSION } from "@aummon/game-engine";
import { Link, NavLink, Outlet } from "react-router";
import { PreviewBanner } from "../components/PreviewBanner.tsx";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `am-sticker am-pressable px-3 py-1.5 text-sm font-semibold ${isActive ? "bg-am-hover" : "bg-am-card"}`;

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <PreviewBanner />
      <header className="flex items-center justify-between gap-3 py-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <Link to="/" className="font-display text-2xl font-bold">
          AumMon
        </Link>
        <nav aria-label="Account" className="flex gap-2">
          <NavLink to="/login" className={navClass}>
            เข้าสู่ระบบ
          </NavLink>
          <NavLink to="/register" className={navClass}>
            สมัคร
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
      <footer className="px-4 py-4 text-center text-xs text-am-muted">
        <span className="rounded-full bg-am-round px-3 py-1 font-semibold text-white">
          Rulebook v{RULESET_VERSION}
        </span>{" "}
        · engine {ENGINE_VERSION}
      </footer>
    </div>
  );
}
