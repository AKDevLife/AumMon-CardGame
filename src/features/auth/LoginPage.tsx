import { Link } from "react-router";
import { TextField } from "../../components/TextField.tsx";
import { AuthCard } from "./AuthCard.tsx";

export function LoginPage() {
  return (
    <AuthCard
      title="เข้าสู่ระบบ"
      submitLabel="เข้าสู่ระบบ"
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
