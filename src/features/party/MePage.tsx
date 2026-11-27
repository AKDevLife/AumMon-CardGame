import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/auth-context.ts";
import { ensurePlayer, validNickname } from "./guest.ts";
import { alertBox, field, panel, primary, secondary } from "./ui.ts";

/**
 * Profile (R6): nickname; guests can save the account with e-mail + password and keep the same
 * user id (docs/platform/PLATFORM_SPEC.md). Linking is blocked during an active match (L2).
 */
export function MePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inMatch, setInMatch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);
  const session = auth.mode === "live" ? auth.session : null;
  const userId = session?.user.id;
  const isGuest = session?.user.is_anonymous === true;

  useEffect(() => {
    if (auth.mode !== "live" || !userId) return;
    let active = true;
    void Promise.all([
      auth.client
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single<{ display_name: string }>(),
      auth.client
        .from("match_players")
        .select("match_id, matches!inner(status)")
        .eq("user_id", userId)
        .eq("matches.status", "active")
        .limit(1),
    ]).then(([p, mp]) => {
      if (!active) return;
      if (p.data) setNick(p.data.display_name);
      setInMatch((mp.data?.length ?? 0) > 0);
    });
    return () => {
      active = false;
    };
  }, [auth, userId]);

  if (auth.mode !== "live") return <p className="text-center text-party-muted">Preview</p>;
  if (!session) {
    return (
      <p className="text-center">
        ยังไม่ได้เข้าเล่น —{" "}
        <Link to="/bluff" className="text-party-accent underline">
          ตั้งชื่อเล่นที่หน้าแรก
        </Link>
      </p>
    );
  }
  const { client } = auth;

  const saveNick = async () => {
    if (!validNickname(nick)) {
      setError("ชื่อเล่น 2–24 ตัวอักษร");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensurePlayer(client, session, nick);
      setNotice("บันทึกชื่อเล่นแล้ว");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const link = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      setError("อีเมลไม่ถูกต้อง หรือรหัสผ่านสั้นกว่า 8 ตัว");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const step1 = await client.auth.updateUser({ email });
    if (step1.error) {
      setBusy(false);
      setError(
        step1.error.code === "email_exists"
          ? "อีเมลนี้มีบัญชีอยู่แล้ว — เข้าสู่ระบบบัญชีนั้นได้ แต่ข้อมูลของ guest นี้จะไม่ถูกย้าย"
          : "บันทึกอีเมลไม่สำเร็จ",
      );
      return;
    }
    const step2 = await client.auth.updateUser({ password });
    setBusy(false);
    if (step2.error) {
      setError("ตั้งรหัสผ่านไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    await client.auth.refreshSession();
    setNotice("บันทึกบัญชีแล้ว (ถ้าระบบส่งอีเมลยืนยัน กดลิงก์ในอีเมลก่อน) — ข้อมูลเดิมยังอยู่ครบ");
  };

  const signOut = async () => {
    await client.auth.signOut();
    void navigate("/");
  };

  return (
    <>
      <h1 className="text-2xl font-bold">โปรไฟล์</h1>
      <section className={`${panel} flex flex-col gap-3`}>
        <label className="flex flex-col gap-1">
          <span>ชื่อเล่น</span>
          <input
            value={nick}
            maxLength={24}
            onChange={(e) => {
              setNick(e.target.value);
            }}
            className={field}
          />
        </label>
        <button type="button" className={secondary} disabled={busy} onClick={() => void saveNick()}>
          บันทึกชื่อเล่น
        </button>
      </section>

      {isGuest ? (
        <section className={`${panel} flex flex-col gap-3`} aria-label="บันทึกบัญชี">
          <h2 className="text-lg font-bold">บันทึกบัญชี</h2>
          <p className="text-sm text-party-muted">
            ตอนนี้คุณเล่นแบบ guest ข้อมูลจะอยู่แค่ในเครื่องนี้ ใส่อีเมลและรหัสผ่านเพื่อเก็บไว้ (ไอดีเดิม ข้อมูลไม่หาย)
          </p>
          {inMatch ? (
            <p className="text-party-pink">กำลังเล่นแมตช์อยู่ — บันทึกบัญชีได้หลังจบเกม</p>
          ) : (
            <>
              <input
                type="email"
                placeholder="อีเมล"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                className={field}
              />
              <input
                type="password"
                placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                className={field}
              />
              <button type="button" className={primary} disabled={busy} onClick={() => void link()}>
                บันทึกบัญชี
              </button>
            </>
          )}
        </section>
      ) : (
        <section className={`${panel} flex flex-col gap-2`}>
          <p>บัญชี: {session.user.email}</p>
          <Link to="/profile" className="text-party-accent underline">
            สถิติ / ลบบัญชี
          </Link>
        </section>
      )}

      {confirmOut ? (
        <button type="button" className={secondary} onClick={() => void signOut()}>
          {isGuest ? "ยืนยัน — ข้อมูล guest ในเครื่องนี้จะหายถ้ายังไม่บันทึกบัญชี" : "ยืนยันออกจากระบบ"}
        </button>
      ) : (
        <button
          type="button"
          className="self-center text-sm text-party-muted underline"
          onClick={() => {
            setConfirmOut(true);
          }}
        >
          ออกจากระบบ
        </button>
      )}
      {notice && (
        <p role="status" className="text-party-green">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className={alertBox}>
          {error}
        </p>
      )}
    </>
  );
}
