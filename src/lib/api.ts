import type { SupabaseClient } from "@supabase/supabase-js";

/** Region of the Supabase project database (AumMon-Dev: Tokyo). */
const DEFAULT_FUNCTIONS_REGION = "ap-northeast-1";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** POST to an Edge Function with the current user's session (server validates everything). */
export async function callFunction<T>(
  client: SupabaseClient,
  name: string,
  body: unknown,
): Promise<T> {
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, "unauthenticated", "กรุณาเข้าสู่ระบบ");
  const base = import.meta.env.VITE_SUPABASE_URL ?? "";
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
  let response: Response;
  try {
    response = await fetch(`${base}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: key,
        // Run Edge Functions next to the database (task 7.6: cross-region calls made
        // each command ~40x slower). Override with VITE_SUPABASE_FUNCTIONS_REGION.
        "x-region": import.meta.env.VITE_SUPABASE_FUNCTIONS_REGION ?? DEFAULT_FUNCTIONS_REGION,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const code = typeof json["error"] === "string" ? json["error"] : "error";
    const message = typeof json["message"] === "string" ? json["message"] : "เกิดข้อผิดพลาด";
    throw new ApiError(response.status, code, message);
  }
  return json as T;
}
