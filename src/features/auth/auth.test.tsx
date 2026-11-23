import type { SupabaseClient } from "@supabase/supabase-js";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { routes } from "../../app/routes.tsx";
import { AuthProvider } from "./AuthProvider.tsx";

interface MockOptions {
  session?: { user: { email: string } } | null;
  signInError?: boolean;
  signUpSession?: boolean;
}

function mockClient({
  session = null,
  signInError = false,
  signUpSession = true,
}: MockOptions = {}) {
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session } }),
    onAuthStateChange: vi
      .fn()
      .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi
      .fn()
      .mockResolvedValue({ error: signInError ? new Error("Invalid login credentials") : null }),
    signUp: vi
      .fn()
      .mockResolvedValue({ data: { session: signUpSession ? {} : null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  // Game Center hub reads public.games (enabled games only).
  const from = () => ({
    select: () => Promise.resolve({ data: [{ id: "edo_battle" }], error: null }),
  });
  return { client: { auth, from } as unknown as SupabaseClient, auth };
}

function renderAt(path: string, client: SupabaseClient) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AuthProvider client={client}>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("auth (live mode)", () => {
  it("hides the preview banner and enables the login form", () => {
    renderAt("/login", mockClient().client);
    expect(screen.queryByText(/ยังไม่เชื่อมระบบจริง/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeEnabled();
  });

  it("validates input before calling Supabase", () => {
    const { client, auth } = mockClient();
    renderAt("/login", client);
    fill("อีเมล", "bad");
    fireEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));
    expect(screen.getByRole("alert")).toHaveTextContent("อีเมล");
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("logs in and navigates home", async () => {
    const { client, auth } = mockClient();
    const router = renderAt("/login", client);
    fill("อีเมล", "a@test.local");
    fill("รหัสผ่าน", "secret123");
    fireEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@test.local",
      password: "secret123",
    });
  });

  it("shows a generic error on failed login", async () => {
    renderAt("/login", mockClient({ signInError: true }).client);
    fill("อีเมล", "a@test.local");
    fill("รหัสผ่าน", "wrongpass");
    fireEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  });

  it("registers with display name metadata", async () => {
    const { client, auth } = mockClient();
    const router = renderAt("/register", client);
    fill("ชื่อที่แสดง", "  Aum ");
    fill("อีเมล", "a@test.local");
    fill("รหัสผ่าน", "secret123");
    fireEvent.click(screen.getByRole("button", { name: "สร้างบัญชี" }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@test.local",
      password: "secret123",
      options: { data: { display_name: "Aum" }, emailRedirectTo: window.location.origin },
    });
  });

  it("asks for email confirmation when no session is returned", async () => {
    renderAt("/register", mockClient({ signUpSession: false }).client);
    fill("ชื่อที่แสดง", "Aum");
    fill("อีเมล", "a@test.local");
    fill("รหัสผ่าน", "secret123");
    fireEvent.click(screen.getByRole("button", { name: "สร้างบัญชี" }));
    expect(await screen.findByText(/ยืนยันอีเมล/)).toBeInTheDocument();
  });

  it("rejects a too-short display name", () => {
    const { client, auth } = mockClient();
    renderAt("/register", client);
    fill("ชื่อที่แสดง", "A");
    fireEvent.click(screen.getByRole("button", { name: "สร้างบัญชี" }));
    expect(screen.getByRole("alert")).toHaveTextContent("2–24");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("shows the signed-in user and logs out", async () => {
    const { client, auth } = mockClient({ session: { user: { email: "a@test.local" } } });
    renderAt("/", client);
    fireEvent.click(await screen.findByRole("button", { name: "ตั้งค่า" }));
    expect(await screen.findByRole("link", { name: "โปรไฟล์" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ออกจากระบบ" }));
    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
    });
  });
});
