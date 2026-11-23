import { useLocation, useNavigate } from "react-router";

/** Pages with their own leave flow (running tables) or no "back" (home). */
const HIDDEN = [/^\/$/, /^\/game\//, /^\/games\/[^/]+\/match\//];

/** Header "back" button: previous page in this tab, else home. */
export function BackButton() {
  const { pathname, key } = useLocation();
  const navigate = useNavigate();
  if (HIDDEN.some((r) => r.test(pathname))) return null;
  return (
    <button
      type="button"
      onClick={() => {
        // "default" key = first page loaded in this tab: nothing to go back to inside the app.
        if (key === "default") void navigate("/");
        else void navigate(-1);
      }}
      className="am-sticker am-pressable bg-am-card px-3 py-1.5 text-sm font-semibold"
    >
      <span aria-hidden="true">←</span> ย้อนกลับ
    </button>
  );
}
