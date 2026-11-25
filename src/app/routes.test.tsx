import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { routes } from "./routes.tsx";

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe("app routes", () => {
  it.each(["/", "/login", "/register", "/missing"])("%s shows the preview banner", (path) => {
    renderAt(path);
    expect(screen.getByRole("status")).toHaveTextContent("ยังไม่เชื่อมระบบจริง");
  });

  it("home shows title, ruleset and disabled modes", () => {
    renderAt("/edo");
    expect(screen.getByRole("heading", { level: 1, name: "AumMon" })).toBeInTheDocument();
    expect(screen.getByText("Game Center")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /EDO Battle/ })).toBeInTheDocument();
    for (const name of ["Solo vs Bot", "Online"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
  });

  it("home header holds the settings button next to the account links", () => {
    renderAt("/edo");
    const nav = screen.getByRole("navigation", { name: "Account" });
    expect(within(nav).getByRole("button", { name: /ตั้งค่า/ })).toBeEnabled();
  });

  it("home offers the rules button", () => {
    renderAt("/edo");
    expect(screen.getByRole("button", { name: /วิธีเล่น & กติกา/ })).toBeEnabled();
  });

  it("back button shows on inner pages, not on home", () => {
    renderAt("/login");
    expect(screen.getByRole("button", { name: /ย้อนกลับ/ })).toBeEnabled();
  });

  it("settings on inner pages offers a home link", async () => {
    renderAt("/login");
    fireEvent.click(screen.getByRole("button", { name: /ตั้งค่า/ }));
    const dialog = await screen.findByRole("dialog", { name: "ตั้งค่า" });
    expect(within(dialog).getByRole("link", { name: /หน้าหลัก/ })).toHaveAttribute("href", "/");
  });

  it("home has no back button", () => {
    renderAt("/");
    expect(screen.queryByRole("button", { name: /ย้อนกลับ/ })).toBeNull();
  });

  it("login form cannot be submitted in preview", () => {
    renderAt("/login");
    expect(screen.getByLabelText("อีเมล")).toBeInTheDocument();
    expect(screen.getByLabelText("รหัสผ่าน")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeDisabled();
  });

  it("register form enforces display name length and cannot be submitted", () => {
    renderAt("/register");
    const name = screen.getByLabelText("ชื่อที่แสดง");
    expect(name).toHaveAttribute("minlength", "2");
    expect(name).toHaveAttribute("maxlength", "24");
    expect(screen.getByRole("button", { name: "สร้างบัญชี" })).toBeDisabled();
  });

  it("unknown path shows not found", () => {
    renderAt("/missing");
    expect(screen.getByRole("heading", { name: "ไม่พบหน้านี้" })).toBeInTheDocument();
  });

  it.each(["/privacy", "/terms"])("%s is marked as a draft", (path) => {
    renderAt(path);
    expect(screen.getByRole("note")).toHaveTextContent("ร่าง");
  });
});
