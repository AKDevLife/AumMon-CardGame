import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { StickerButton } from "../../components/StickerButton.tsx";
import { TextField } from "../../components/TextField.tsx";

/** TOTP MFA (Supabase Auth): enroll once, then verify each session → aal2. */
export function MfaPanel({
  client,
  onVerified,
}: {
  client: SupabaseClient;
  onVerified: () => void;
}) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error: listError } = await client.auth.mfa.listFactors();
      if (listError) {
        setError("โหลด MFA ไม่สำเร็จ");
        return;
      }
      const verified = data.totp[0];
      if (verified) {
        setFactorId(verified.id);
        return;
      }
      // Remove half-finished enrollments, then start a fresh one.
      for (const f of data.all.filter((x) => x.status === "unverified"))
        await client.auth.mfa.unenroll({ factorId: f.id });
      const { data: enrolled, error: enrollError } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "AumMon admin",
      });
      if (enrollError) {
        setError("เริ่มตั้งค่า MFA ไม่สำเร็จ");
        return;
      }
      setFactorId(enrolled.id);
      setQr(enrolled.totp.qr_code);
      setSecret(enrolled.totp.secret);
    })();
  }, [client]);

  const verify = async () => {
    if (!factorId) return;
    setPending(true);
    setError(null);
    const { error: verifyError } = await client.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    setPending(false);
    if (verifyError) setError("รหัสไม่ถูกต้อง ลองใหม่");
    else onVerified();
  };

  return (
    <section className="am-sticker flex flex-col gap-3 bg-am-card p-4">
      <h2 className="font-display text-xl font-bold">ยืนยันตัวตน 2 ชั้น (MFA)</h2>
      {qr && (
        <>
          <p className="text-sm">
            สแกน QR ด้วยแอป Authenticator (เช่น Google Authenticator) แล้วกรอกรหัส 6 หลัก
          </p>
          <img
            src={qr}
            alt="QR code สำหรับแอป Authenticator"
            className="mx-auto h-48 w-48 bg-am-card p-2"
          />
          <p className="break-all text-xs text-am-muted">หรือกรอกรหัสลับ: {secret}</p>
        </>
      )}
      {!qr && factorId && <p className="text-sm">กรอกรหัส 6 หลักจากแอป Authenticator</p>}
      <TextField
        label="รหัส MFA"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
        }}
      />
      {error && (
        <p
          role="alert"
          className="rounded-lg border-l-4 border-am-red bg-am-error-bg px-2 py-1 font-semibold text-am-danger-text"
        >
          {error}
        </p>
      )}
      <StickerButton
        variant="confirm"
        disabled={pending || code.trim().length !== 6}
        onClick={() => void verify()}
      >
        {pending ? "กำลังตรวจสอบ…" : "ยืนยัน"}
      </StickerButton>
    </section>
  );
}
