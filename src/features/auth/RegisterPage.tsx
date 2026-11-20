import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { TextField } from "../../components/TextField.tsx";
import { AuthCard } from "./AuthCard.tsx";
import { useAuth } from "./auth-context.ts";
import {
  formText,
  MIN_PASSWORD_LENGTH,
  validateCredentials,
  validateDisplayName,
} from "./validation.ts";

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (form: FormData) => {
    if (auth.mode !== "live") return;
    const displayName = formText(form, "displayName").trim();
    const email = formText(form, "email").trim();
    const password = formText(form, "password");
    const invalid = validateDisplayName(displayName) ?? validateCredentials({ email, password });
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    setNotice(null);
    const { data, error: signUpError } = await auth.client.auth.signUp({
      email,
      password,
      // After email confirmation, return to this deployment (must be in Auth redirect allow-list).
      options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
    });
    setPending(false);
    if (signUpError) {
      setError("สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    if (data.session) {
      void navigate("/");
    } else {
      setNotice("กรุณายืนยันอีเมลของคุณ แล้วจึงเข้าสู่ระบบ");
    }
  };

  return (
    <AuthCard
      title="สมัครสมาชิก"
      submitLabel="สร้างบัญชี"
      enabled={auth.mode === "live"}
      pending={pending}
      error={error}
      notice={notice}
      onSubmit={(form) => void submit(form)}
      footer={
        <>
          มีบัญชีแล้ว?{" "}
          <Link to="/login" className="font-semibold text-am-accent underline">
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      <TextField
        label="ชื่อที่แสดง"
        name="displayName"
        autoComplete="nickname"
        minLength={2}
        maxLength={24}
        hint="2–24 ตัวอักษร"
      />
      <TextField label="อีเมล" type="email" name="email" autoComplete="email" inputMode="email" />
      <TextField
        label="รหัสผ่าน"
        type="password"
        name="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={`อย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`}
      />
    </AuthCard>
  );
}
