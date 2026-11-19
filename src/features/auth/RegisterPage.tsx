import { Link } from "react-router";
import { TextField } from "../../components/TextField.tsx";
import { AuthCard } from "./AuthCard.tsx";

export function RegisterPage() {
  return (
    <AuthCard
      title="สมัครสมาชิก"
      submitLabel="สร้างบัญชี"
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
      <TextField label="รหัสผ่าน" type="password" name="password" autoComplete="new-password" />
    </AuthCard>
  );
}
