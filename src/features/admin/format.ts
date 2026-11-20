import type { v2 } from "@aummon/game-engine";
import { cardName, describeEvent, KEYWORD_LABEL } from "../tcg/labels.ts";

/** Human-readable Thai text for admin data (no database/program words on screen). */

export function dateTime(v: unknown): string {
  if (typeof v !== "string" && !(v instanceof Date)) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export function ago(v: unknown): string {
  if (typeof v !== "string") return "—";
  const sec = Math.round((Date.now() - Date.parse(v)) / 1000);
  if (!Number.isFinite(sec)) return "—";
  if (sec < 60) return "เมื่อสักครู่";
  if (sec < 3600) return `${Math.floor(sec / 60)} นาทีที่แล้ว`;
  if (sec < 86_400) return `${Math.floor(sec / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(sec / 86_400)} วันที่แล้ว`;
}

const MAPS: Record<string, Record<string, string>> = {
  roomStatus: { lobby: "รอผู้เล่น", playing: "กำลังเล่น", closed: "ปิดแล้ว" },
  matchStatus: { active: "กำลังเล่น", finished: "จบแล้ว", abandoned: "ถูกยุติ", created: "กำลังเริ่ม" },
  mode: { solo: "เล่นกับ Bot", pass_play: "เครื่องเดียวกัน", online: "ออนไลน์" },
  phase: { mulligan: "เลือกเปลี่ยนการ์ด", main: "ช่วงลงการ์ด", battle: "ช่วงต่อสู้" },
  seatType: { human: "ผู้เล่น", bot: "Bot", local: "ผู้เล่นในเครื่อง" },
  cardType: {
    unit: "Unit (ตัวละคร)",
    action: "Action (ใช้แล้วทิ้ง)",
    equipment: "Equipment (อุปกรณ์)",
    field: "Field (สนาม)",
  },
  rarity: { normal: "ธรรมดา", rare: "หายาก", super_rare: "หายากมาก" },
  env: {
    development: "ทดสอบ (Dev)",
    staging: "ก่อนเปิดจริง (Staging)",
    production: "ใช้งานจริง (Production)",
  },
  action: {
    "admin.granted": "ให้สิทธิ์ Admin",
    "admin.revoked": "ถอนสิทธิ์ Admin",
    "player.disabled": "ระงับบัญชีผู้เล่น",
    "player.enabled": "เปิดใช้บัญชีผู้เล่น",
    "room.closed": "ปิดห้อง",
    "match.abandoned": "ยุติแมตช์",
    "bots.simulated": "ทดสอบ Bot",
  },
  httpStatus: {
    "401": "ไม่ได้ล็อกอิน / Session หมดอายุ",
    "403": "ไม่มีสิทธิ์",
    "429": "ส่งคำขอถี่เกินไป",
    "500": "ระบบผิดพลาด",
  },
};

export function label(map: keyof typeof MAPS, v: unknown): string {
  const key = typeof v === "number" ? String(v) : typeof v === "string" ? v : "";
  return MAPS[map]?.[key] ?? (key || "—");
}

export const yesNo = (v: unknown): string => (v === true ? "ใช่" : "ไม่");

export function keywords(v: unknown): string {
  if (!Array.isArray(v) || v.length === 0) return "—";
  return v
    .map((k) =>
      typeof k === "string" && k in KEYWORD_LABEL ? KEYWORD_LABEL[k as v2.Keyword] : String(k),
    )
    .join(", ");
}

export const card = (v: unknown): string => (typeof v === "string" ? cardName(v) : "—");

/** Readable game event sentence from its public payload (seats shown as Player 1/2). */
export function eventText(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) return "—";
  return describeEvent(payload as v2.GameEvent, ["ผู้เล่น 1", "ผู้เล่น 2"]) ?? "จบเทิร์น / จั่วการ์ด";
}

export function shortId(v: unknown): string {
  return typeof v === "string" ? `#${v.slice(0, 6)}` : "—";
}

/** Seats of a match as "ผู้เล่น ❤️12 · Bot ❤️5". */
export function seats(v: unknown): string {
  if (!Array.isArray(v)) return "—";
  return v
    .map(
      (p: { type?: string; hp?: number }) =>
        `${label("seatType", p.type)} ❤️${String(p.hp ?? "?")}`,
    )
    .join(" · ");
}
