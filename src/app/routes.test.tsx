import { render, screen, within } from "@testing-library/react";
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
    renderAt("/");
    expect(screen.getByRole("heading", { level: 1, name: "AumMon" })).toBeInTheDocument();
    expect(screen.getByText("Game Center")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /EDO Battle/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /ดัมมี่/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /โป๊กเกอร์/ })).toBeInTheDocument();
    for (const name of ["Solo vs Bot", "Online"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
  });

  it("home header holds the settings button next to the account links", () => {
    renderAt("/");
    const nav = screen.getByRole("navigation", { name: "Account" });
    expect(within(nav).getByRole("button", { name: /ตั้งค่า/ })).toBeEnabled();
  });

  it("home offers the rules button", () => {
    renderAt("/");
    expect(screen.getByRole("button", { name: /วิธีเล่น & กติกา/ })).toBeEnabled();
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
