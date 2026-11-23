import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { AudioSettings } from "../game/AudioSettings.tsx";
import { Popup } from "../game/Popup.tsx";
import { useAuth } from "./auth-context.ts";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `am-sticker am-pressable px-3 py-1.5 text-sm font-semibold ${isActive ? "bg-am-hover" : "bg-am-card"}`;

/** Sound / music settings on the home page header (tables have their own settings button). */
function SettingsButton() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  if (pathname !== "/") return null;
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
      <Popup
        title="ตั้งค่า"
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <AudioSettings />
      </Popup>
    </>
  );
}

export function AccountNav() {
  const auth = useAuth();
  const [error, setError] = useState(false);

  if (auth.mode === "live" && auth.session) {
    const signOut = async () => {
      const { error: signOutError } = await auth.client.auth.signOut();
      setError(Boolean(signOutError));
    };
    return (
      <nav aria-label="Account" className="flex flex-wrap items-center justify-end gap-2">
        <SettingsButton />
        <NavLink to="/profile" className={navClass}>
          โปรไฟล์
        </NavLink>
        <button
          type="button"
          onClick={() => void signOut()}
          className="am-sticker am-pressable bg-am-card px-3 py-1.5 text-sm font-semibold"
        >
          ออกจากระบบ
        </button>
        {error && (
          <span role="alert" className="border-l-4 border-am-danger pl-1 text-xs">
            ออกจากระบบไม่สำเร็จ
          </span>
        )}
      </nav>
    );
  }

  return (
    <nav aria-label="Account" className="flex flex-wrap items-center justify-end gap-2">
      <SettingsButton />
      <NavLink to="/login" className={navClass}>
        เข้าสู่ระบบ
      </NavLink>
      <NavLink to="/register" className={navClass}>
        สมัคร
      </NavLink>
    </nav>
  );
}
