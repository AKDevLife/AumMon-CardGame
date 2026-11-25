import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BluffPrototype } from "./BluffPrototype.tsx";

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("BLUFF prototype", () => {
  it("walks Home → Lobby → round → results", () => {
    render(<BluffPrototype />);
    fireEvent.change(screen.getByLabelText("ชื่อเล่น"), { target: { value: "ออม" } });
    click("สร้างห้อง");
    expect(screen.getByText("K7QX")).toBeInTheDocument();
    click("เริ่มเกม");
    click("ต่อไป");
    click("ฉันเลือก C");
    click("ประกาศแล้ว ต่อไป");
    const lock = screen.getByRole("button", { name: "ล็อก" });
    expect(lock).toBeDisabled();
    click("A ข้าวผัดกะเพราไข่ดาว");
    click("A");
    click("2");
    click("ล็อก");
    expect(screen.getAllByText("โกหก!")).toHaveLength(1);
    click("ดูคะแนน");
    expect(screen.getByText("+5")).toBeInTheDocument();
    click(/ผลสุดท้าย/);
    expect(screen.getByRole("list", { name: "อันดับ" })).toHaveTextContent("ออม");
  });
});
