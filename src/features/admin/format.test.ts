import { describe, expect, it } from "vitest";
import { card, eventText, label, seats, shortId, yesNo } from "./format.ts";

describe("admin readable formatting", () => {
  it("translates codes into Thai", () => {
    expect(label("roomStatus", "lobby")).toBe("รอผู้เล่น");
    expect(label("mode", "online")).toBe("ออนไลน์");
    expect(label("action", "player.disabled")).toBe("ระงับบัญชีผู้เล่น");
    expect(label("httpStatus", 429)).toBe("ส่งคำขอถี่เกินไป");
    expect(label("mode", "unknown")).toBe("unknown");
    expect(yesNo(true)).toBe("ใช่");
    expect(label("stale", "finished")).toBe("เกมจบหรือถูกยุติแล้ว แต่ห้องยังเปิดค้าง");
  });

  it("formats game data", () => {
    expect(card("D01")).toBe("หนังยาง");
    expect(eventText({ type: "unknown_old_event" })).toBe("—");
    expect(eventText({ type: "passed", seat: 1, forced: false })).toBe("ผู้เล่น 2 ผ่าน");
    expect(
      seats([
        { type: "human", cards: 7 },
        { type: "bot", cards: 5 },
      ]),
    ).toBe("ผู้เล่น 🃏7 · Bot 🃏5");
    expect(shortId("abcdef123")).toBe("#abcdef");
  });
});
