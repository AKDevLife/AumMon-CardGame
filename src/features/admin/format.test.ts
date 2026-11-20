import { describe, expect, it } from "vitest";
import { card, eventText, keywords, label, seats, shortId, yesNo } from "./format.ts";

describe("admin readable formatting", () => {
  it("translates codes into Thai", () => {
    expect(label("roomStatus", "lobby")).toBe("รอผู้เล่น");
    expect(label("mode", "pass_play")).toBe("เครื่องเดียวกัน");
    expect(label("action", "player.disabled")).toBe("ระงับบัญชีผู้เล่น");
    expect(label("httpStatus", 429)).toBe("ส่งคำขอถี่เกินไป");
    expect(label("mode", "unknown")).toBe("unknown");
    expect(yesNo(true)).toBe("ใช่");
    expect(label("stale", "finished")).toBe("เกมจบหรือถูกยุติแล้ว แต่ห้องยังเปิดค้าง");
  });

  it("formats game data", () => {
    expect(card("U001_RUBBER_DUCKLING")).toBe("Rubber Duckling");
    expect(keywords(["haste", "guard"])).toBe("Haste, Guard");
    expect(eventText({ type: "turn_ended", seat: 0 })).toBe("จบเทิร์น / จั่วการ์ด");
    expect(eventText({ type: "forfeit", seat: 1 })).toBe("ผู้เล่น 2 ยอมแพ้");
    expect(
      seats([
        { type: "human", hp: 12 },
        { type: "bot", hp: 5 },
      ]),
    ).toBe("ผู้เล่น ❤️12 · Bot ❤️5");
    expect(shortId("abcdef123")).toBe("#abcdef");
  });
});
