import { validateDisplayName } from "../auth/validation.ts";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

const NICK_KEY = "aummon.nickname";

export function savedNickname(): string {
  try {
    return localStorage.getItem(NICK_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Same rule as the database check on profiles.display_name (2–24 characters). */
export const validNickname = (n: string) => validateDisplayName(n) === null;

/**
 * Guest-first (R1): a visitor without a session becomes a Supabase anonymous user with the
 * nickname as profile display name; a signed-in player just updates the nickname.
 */
export async function ensurePlayer(
  client: SupabaseClient,
  session: Session | null,
  nickname: string,
): Promise<void> {
  const name = nickname.trim();
  try {
    localStorage.setItem(NICK_KEY, name);
  } catch {
    // storage unavailable — nickname still sent to the server
  }
  if (!session) {
    const { error } = await client.auth.signInAnonymously({
      options: { data: { display_name: name } },
    });
    if (error) throw new Error("เข้าเล่นแบบ guest ไม่สำเร็จ ลองใหม่อีกครั้ง");
    return;
  }
  const { error } = await client
    .from("profiles")
    .update({ display_name: name })
    .eq("id", session.user.id);
  if (error) throw new Error("บันทึกชื่อเล่นไม่สำเร็จ");
}
