export const MIN_PASSWORD_LENGTH = 6; // matches supabase/config.toml auth.minimum_password_length

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Credentials {
  email: string;
  password: string;
}

export function validateCredentials({ email, password }: Credentials): string | null {
  if (!EMAIL_RE.test(email.trim())) return "กรุณากรอกอีเมลให้ถูกต้อง";
  if (password.length < MIN_PASSWORD_LENGTH)
    return `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`;
  return null;
}

export function validateDisplayName(name: string): string | null {
  const length = name.trim().length;
  return length >= 2 && length <= 24 ? null : "ชื่อที่แสดงต้องมี 2–24 ตัวอักษร";
}

export function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
