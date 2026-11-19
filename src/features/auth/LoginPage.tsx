import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { TextField } from "../../components/TextField.tsx";
import { AuthCard } from "./AuthCard.tsx";
import { useAuth } from "./auth-context.ts";
import { formText, validateCredentials } from "./validation.ts";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (form: FormData) => {
    if (auth.mode !== "live") return;
    const email = formText(form, "email").trim();
    const password = formText(form, "password");
    const invalid = validateCredentials({ email, password });
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    const { error: signInError } = await auth.client.auth.signInWithPassword({ email, password });
    setPending(false);
    if (signInError) {
      // Generic message: do not reveal whether the account exists.
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    void navigate("/");
  };

  return (
    <AuthCard
      title="เข้าสู่ระบบ"
      submitLabel="เข้าสู่ระบบ"
      enabled={auth.mode === "live"}
      pending={pending}
      error={error}
      onSubmit={(form) => void submit(form)}
      footer={
        <>
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="font-semibold text-am-accent underline">
            สมัครสมาชิก
          </Link>
        </>
      }
    >
      <TextField label="อีเมล" type="email" name="email" autoComplete="email" inputMode="email" />
      <TextField label="รหัสผ่าน" type="password" name="password" autoComplete="current-password" />
    </AuthCard>
  );
}
