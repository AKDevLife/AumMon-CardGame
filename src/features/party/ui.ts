/** Shared class names of the v2 dark party theme (docs/v2/AumMon_UI_UX_Guidelines.md §2). */
export const panel = "rounded-2xl border border-party-border bg-party-surface p-4";
export const primary =
  "flex min-h-12 w-full items-center justify-center rounded-2xl bg-party-accent px-4 py-3 text-lg font-bold text-party-bg disabled:opacity-40";
export const secondary =
  "flex min-h-12 w-full items-center justify-center rounded-2xl border border-party-border px-4 py-3 font-semibold disabled:opacity-40";
export const field =
  "min-h-12 w-full rounded-xl border border-party-border bg-party-surface px-3 text-party-text placeholder:text-party-muted";
export const alertBox =
  "rounded-xl border border-party-red bg-party-surface px-3 py-2 text-party-red";

/** Thai message for server error codes the player can act on. */
export function friendly(code: string, fallback: string): string {
  const map: Record<string, string> = {
    not_enough_content: "คำถามที่อนุมัติแล้วยังไม่พอสำหรับห้องนี้ (Admin ต้องอนุมัติคำถามก่อน)",
    not_ready: "ทุกคนต้องกดพร้อมก่อน",
    not_enough_players: "ต้องมีผู้เล่นอย่างน้อย 2 คน",
    room_full: "ห้องเต็มแล้ว",
    room_not_in_lobby: "เกมในห้องนี้เริ่มไปแล้ว",
    not_found: "ไม่พบห้อง (โค้ดผิดหรือหมดอายุ)",
    rate_limited: "ทำบ่อยเกินไป รอสักครู่แล้วลองใหม่",
    network: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
  };
  return map[code] ?? fallback;
}
