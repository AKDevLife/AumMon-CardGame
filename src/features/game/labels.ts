import type { GameEvent } from "@aummon/game-engine";

/** Card text from aummon_game_spec.md §2 / clarification Q1. */
export const CARD_INFO: Record<
  string,
  { label: string; text: string; target: boolean; choice?: boolean }
> = {
  attack: { label: "Attack", text: "ดาเมจ 1 ใส่เป้าหมาย 1 คน", target: true },
  defense: { label: "Defense", text: "โล่กันดาเมจ 1 หน่วยทั้งรอบ", target: false },
  support: { label: "Support", text: "ฟื้น HP 1 หรือจั่ว 1 ใบ", target: false, choice: true },
  chaos_redirect: { label: "Redirect", text: "เบนการโจมตีที่เล็งมาหาเราไปยังเป้าหมาย", target: true },
  chaos_aoe: { label: "AoE", text: "ดาเมจ 1 ใส่ผู้เล่นอื่นทุกคน", target: false },
  chaos_disrupt: { label: "Disrupt", text: "บังคับเป้าหมายทิ้งการ์ดสุ่ม 1 ใบ", target: true },
};

export const PHASE_LABEL: Record<string, string> = {
  setup: "เตรียมเกม",
  draw: "จั่วการ์ด",
  turn_start: "เริ่มเทิร์น (สกิล Aqua)",
  select: "เลือกการ์ด",
  resolving: "เปิดการ์ด",
  end: "จบเกม",
};

/** Human-readable event log line (public payload only). */
export function describeEvent(e: GameEvent, name: (id: unknown) => string): string | null {
  const p = e.publicPayload;
  switch (e.type) {
    case "round.started":
      return `— รอบที่ ${e.round} —`;
    case "skill.swap":
      return `${name(p["playerId"])} สลับการ์ดกับ ${name(p["targetPlayerId"])}`;
    case "actions.revealed": {
      const actions = Array.isArray(p["actions"])
        ? (p["actions"] as Record<string, unknown>[])
        : [];
      return actions
        .map((a) => {
          const card = CARD_INFO[String(a["definitionId"])]?.label ?? "?";
          const target = a["targetPlayerId"] ? ` → ${name(a["targetPlayerId"])}` : "";
          const choice = a["choice"] ? ` (${a["choice"] === "heal" ? "ฟื้น" : "จั่ว"})` : "";
          return `${name(a["playerId"])}: ${card}${target}${choice}${a["auto"] ? " [อัตโนมัติ]" : ""}`;
        })
        .join(" · ");
    }
    case "hit":
      return `${name(p["attackerId"])} ทำดาเมจ ${String(p["damage"])} ใส่ ${name(p["targetId"])}${Number(p["absorbed"]) > 0 ? " (โล่กัน)" : ""}${Number(p["bonus"]) > 0 ? " (+1 โบนัส)" : ""}`;
    case "hit.dodged":
      return `${name(p["targetId"])} หลบได้ (ทิ้งการ์ด 1 ใบ)`;
    case "action.redirected":
      return `การโจมตีถูกเบนจาก ${name(p["from"])} ไป ${name(p["to"])}`;
    case "action.fizzled":
      return `การโจมตีของ ${name(p["actorId"])} พลาดเป้า`;
    case "action.cancelled":
      return `${name(p["playerId"])} ถูกคัดออกก่อนถึงตา`;
    case "card.disrupted":
      return `${name(p["targetId"])} ถูกบังคับทิ้งการ์ด`;
    case "support.heal":
      return `${name(p["playerId"])} ฟื้น HP ${String(p["healed"])}`;
    case "support.draw":
      return `${name(p["playerId"])} จั่วการ์ด`;
    case "player.eliminated":
      return `💥 ${name(p["playerId"])} ถูกคัดออก`;
    case "timeout.auto":
      return "หมดเวลา — Server Bot เลือกการ์ดแทน";
    default:
      return null;
  }
}

/** Starter character names (spec §3). */
export const CHARACTER_NAME: Record<string, string> = {
  pyro_pup: "ปิโร่ 🔥",
  aqua_otter: "อควา 💧",
  breeze_kit: "บรีซ 🌪️",
  terra_tortoise: "เทอร์ร่า 🪨",
};
