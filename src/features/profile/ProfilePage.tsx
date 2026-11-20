import { useEffect, useState } from "react";
import { Link } from "react-router";
import { TextField } from "../../components/TextField.tsx";
import { AuthCard } from "../auth/AuthCard.tsx";
import { useAuth } from "../auth/auth-context.ts";
import { formText, validateDisplayName } from "../auth/validation.ts";
import { DeleteAccount } from "./DeleteAccount.tsx";

type LoadState =
  { status: "loading" } | { status: "ready"; displayName: string } | { status: "error" };

export function ProfilePage() {
  const auth = useAuth();
  const userId = auth.mode === "live" ? auth.session?.user.id : undefined;
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (auth.mode !== "live" || !userId) return;
    let active = true;
    void auth.client
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single<{ display_name: string }>()
      .then(({ data, error: loadError }) => {
        if (!active) return;
        setLoad(
          loadError ? { status: "error" } : { status: "ready", displayName: data.display_name },
        );
      });
    return () => {
      active = false;
    };
  }, [auth, userId]);

  if (auth.mode !== "live") {
    return <p className="text-center text-am-muted">โปรไฟล์ใช้ได้เมื่อเชื่อมระบบบัญชีแล้ว (Preview)</p>;
  }
  if (auth.loading) return <p className="text-center text-am-muted">กำลังโหลด…</p>;
  if (!userId) {
    return (
      <p className="text-center">
        กรุณา{" "}
        <Link to="/login" className="font-semibold text-am-accent underline">
          เข้าสู่ระบบ
        </Link>{" "}
        ก่อน
      </p>
    );
  }
  if (load.status === "loading") return <p className="text-center text-am-muted">กำลังโหลด…</p>;
  if (load.status === "error") {
    return (
      <p role="alert" className="text-center text-am-danger">
        โหลดโปรไฟล์ไม่สำเร็จ
      </p>
    );
  }

  const save = async (form: FormData) => {
    const displayName = formText(form, "displayName").trim();
    const invalid = validateDisplayName(displayName);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    setNotice(null);
    const { error: saveError } = await auth.client
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", userId);
    setPending(false);
    if (saveError) {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    setLoad({ status: "ready", displayName });
    setNotice("บันทึกแล้ว");
  };

  return (
    <div className="flex flex-col gap-4">
      <AuthCard
        title="โปรไฟล์"
        submitLabel="บันทึก"
        enabled
        pending={pending}
        error={error}
        notice={notice}
        onSubmit={(form) => void save(form)}
        footer={<span className="text-am-muted">{auth.session?.user.email}</span>}
      >
        <TextField
          label="ชื่อที่แสดง"
          name="displayName"
          defaultValue={load.displayName}
          autoComplete="nickname"
          minLength={2}
          maxLength={24}
          hint="2–24 ตัวอักษร"
        />
      </AuthCard>
      <DeleteAccount />
    </div>
  );
}
