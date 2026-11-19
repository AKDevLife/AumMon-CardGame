import { useState } from "react";
import { NavLink } from "react-router";
import { useAuth } from "./auth-context.ts";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `am-sticker am-pressable px-3 py-1.5 text-sm font-semibold ${isActive ? "bg-am-hover" : "bg-am-card"}`;

export function AccountNav() {
  const auth = useAuth();
  const [error, setError] = useState(false);

  if (auth.mode === "live" && auth.session) {
    const signOut = async () => {
      const { error: signOutError } = await auth.client.auth.signOut();
      setError(Boolean(signOutError));
    };
    return (
      <nav aria-label="Account" className="flex items-center gap-2">
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
          <span role="alert" className="text-xs text-am-danger">
            ออกจากระบบไม่สำเร็จ
          </span>
        )}
      </nav>
    );
  }

  return (
    <nav aria-label="Account" className="flex gap-2">
      <NavLink to="/login" className={navClass}>
        เข้าสู่ระบบ
      </NavLink>
      <NavLink to="/register" className={navClass}>
        สมัคร
      </NavLink>
    </nav>
  );
}
