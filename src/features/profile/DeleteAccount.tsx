import { useState } from "react";
import { useNavigate } from "react-router";
import { StickerButton } from "../../components/StickerButton.tsx";
import { ApiError, callFunction } from "../../lib/api.ts";
import { useAuth } from "../auth/auth-context.ts";

/** Task 7.4 — account deletion (forfeits active matches, anonymizes history). */
export function DeleteAccount() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (auth.mode !== "live") return null;

  const remove = async () => {
    setPending(true);
    setError(null);
    try {
      await callFunction(auth.client, "account-delete", { confirm: "DELETE" });
      await auth.client.auth.signOut();
      void navigate("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ลบบัญชีไม่สำเร็จ");
      setPending(false);
    }
  };

  return (
    <section className="am-sticker flex flex-col gap-2 bg-am-card p-4">
      <h2 className="font-display text-xl font-bold text-am-danger">ลบบัญชี</h2>
      <p className="text-sm">เกมที่กำลังเล่นจะถูกยอมแพ้ ประวัติการแข่งขันจะเก็บแบบไม่ระบุตัวตน การลบย้อนกลับไม่ได้</p>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        พิมพ์ DELETE เพื่อยืนยัน
        <input
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
          }}
          autoComplete="off"
          className="am-sticker min-h-11 bg-am-card px-3 text-base shadow-none"
        />
      </label>
      <StickerButton
        variant="danger"
        disabled={confirm !== "DELETE" || pending}
        onClick={() => void remove()}
      >
        {pending ? "กำลังลบ…" : "ลบบัญชีถาวร"}
      </StickerButton>
      {error && (
        <p role="alert" className="border-l-4 border-am-danger pl-2 font-semibold">
          {error}
        </p>
      )}
    </section>
  );
}
