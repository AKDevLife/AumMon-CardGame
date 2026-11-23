import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { AudioSettings } from "../game/AudioSettings.tsx";
import { Popup } from "../game/Popup.tsx";
import { BackButton } from "../../components/BackButton.tsx";
import { isTablePath } from "../../components/table-path.ts";
import { useAuth } from "./auth-context.ts";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `am-sticker am-pressable px-3 py-1.5 text-sm font-semibold ${isActive ? "bg-am-hover" : "bg-am-card"}`;

const menuItem =
  "am-sticker am-pressable flex min-h-11 items-center justify-center gap-2 bg-am-card px-4 py-2 font-display font-semibold";

/** Account actions inside the settings popup (signed-in only). */
function AccountActions({ onDone }: { onDone: () => void }) {
  const auth = useAuth();
  const [error, setError] = useState(false);
  if (auth.mode !== "live" || !auth.session) return null;
  const { client } = auth;
  const signOut = async () => {
    const { error: signOutError } = await client.auth.signOut();
    setError(Boolean(signOutError));
    if (!signOutError) onDone();
  };
  return (
    <div className="mt-4 flex flex-col gap-2 border-t-2 border-am-ink/20 pt-4">
      <h3 className="font-display font-bold">บัญชี</h3>
      <Link to="/profile" onClick={onDone} className={menuItem}>
        <span aria-hidden="true">👤</span> โปรไฟล์
      </Link>
      <button type="button" onClick={() => void signOut()} className={menuItem}>
        <span aria-hidden="true">🚪</span> ออกจากระบบ
      </button>
      {error && (
        <span role="alert" className="border-l-4 border-am-danger pl-1 text-xs">
          ออกจากระบบไม่สำเร็จ
        </span>
      )}
    </div>
  );
}

/** Header settings (every page except running tables, which have their own): sound, home, profile, sign out. */
function SettingsButton() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  if (isTablePath(pathname)) return null;
  const close = () => {
    setOpen(false);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="am-sticker am-pressable bg-am-card px-3 py-1.5 text-sm font-semibold"
      >
        <span aria-hidden="true">⚙️</span> ตั้งค่า
      </button>
      <Popup title="ตั้งค่า" open={open} onClose={close}>
        <AudioSettings />
        <Link to="/" onClick={close} className={`${menuItem} mt-2`}>
          <span aria-hidden="true">🏠</span> หน้าหลัก
        </Link>
        <AccountActions onDone={close} />
      </Popup>
    </>
  );
}

export function AccountNav() {
  const auth = useAuth();
  const signedIn = auth.mode === "live" && auth.session !== null;
  return (
    <nav aria-label="Account" className="flex flex-wrap items-center justify-end gap-2">
      <BackButton />
      <SettingsButton />
      {!signedIn && (
        <>
          <NavLink to="/login" className={navClass}>
            เข้าสู่ระบบ
          </NavLink>
          <NavLink to="/register" className={navClass}>
            สมัคร
          </NavLink>
        </>
      )}
    </nav>
  );
}
