import { ApiError } from "../../lib/api.ts";

/** UI state derived from the server's `me` answer. The server is the real gate. */
export type AdminGate = "loading" | "signed_out" | "forbidden" | "mfa" | "ok" | "error";

export function gateFromError(e: unknown): AdminGate {
  if (!(e instanceof ApiError)) return "error";
  if (e.status === 401) return "signed_out";
  if (e.code === "mfa_required") return "mfa";
  if (e.status === 403) return "forbidden";
  return "error";
}

export function gateFromMe(me: { aal: string }): AdminGate {
  return me.aal === "aal2" ? "ok" : "mfa";
}

export const SECTIONS = [
  { id: "overview", label: "ภาพรวม", help: "สรุปตัวเลขสำคัญของระบบตอนนี้" },
  { id: "players", label: "ผู้เล่น", help: "รายชื่อบัญชีผู้เล่น ค้นหา และระงับ/เปิดใช้บัญชี" },
  {
    id: "cards",
    label: "การ์ด",
    help: "การ์ดสิ่งของ 16 แบบในเกม แต้มและความสามารถ (ดูได้อย่างเดียว — แก้กติกาผ่านเอกสารกติกา)",
  },
  {
    id: "rooms",
    label: "ห้อง",
    help: "ห้องเล่นที่ยังเปิดอยู่ ระบบบอกว่าห้องไหนค้างพร้อมเหตุผล และปิดทีละห้องหรือทั้งหมดได้",
  },
  {
    id: "matches",
    label: "แมตช์",
    help: "เกมที่กำลังเล่นอยู่ ยุติเกมที่ค้างได้ (เห็นเฉพาะข้อมูลที่เปิดเผย ไม่เห็นการ์ดในมือ)",
  },
  {
    id: "bots",
    label: "ทดสอบ Bot",
    help: "ให้ Bot แข่งกันเองบน Server เพื่อดูความสมดุล (ไม่บันทึกเป็นเกมจริง)",
  },
  {
    id: "sounds",
    label: "เสียง",
    help: "เลือกเสียงของแต่ละจังหวะในเกม ปรับความดัง หรือปิดเสียง — มีผลกับผู้เล่นทุกคน",
  },
  { id: "logs", label: "บันทึก", help: "ประวัติการกระทำของ Admin และคำขอที่ถูกปฏิเสธ" },
  { id: "health", label: "สุขภาพระบบ", help: "ความเร็วและข้อผิดพลาดของระบบใน 24 ชั่วโมง" },
  { id: "settings", label: "ตั้งค่า", help: "ค่าระบบปัจจุบัน (ดูได้อย่างเดียว)" },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];
