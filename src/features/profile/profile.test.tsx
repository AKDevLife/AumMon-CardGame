import type { SupabaseClient } from "@supabase/supabase-js";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { routes } from "../../app/routes.tsx";
import { AuthProvider } from "../auth/AuthProvider.tsx";

const session = { user: { id: "user-a", email: "a@test.local" } };

function mockClient({ signedIn = true, loadError = false, saveError = false } = {}) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: saveError ? new Error("x") : null }),
  });
  const single = vi
    .fn()
    .mockResolvedValue(
      loadError
        ? { data: null, error: new Error("x") }
        : { data: { display_name: "Aum" }, error: null },
    );
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }),
    update,
  });
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: signedIn ? session : null } }),
    onAuthStateChange: vi
      .fn()
      .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signOut: vi.fn(),
  };
  return { client: { auth, from } as unknown as SupabaseClient, update, from };
}

function renderProfile(client: SupabaseClient) {
  render(
    <AuthProvider client={client}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: ["/profile"] })} />
    </AuthProvider>,
  );
}

describe("profile page", () => {
  it("asks to log in when signed out", async () => {
    renderProfile(mockClient({ signedIn: false }).client);
    expect(await screen.findByText(/กรุณา/)).toBeInTheDocument();
  });

  it("loads only the signed-in user's profile", async () => {
    const { client, from } = mockClient();
    renderProfile(client);
    expect(await screen.findByDisplayValue("Aum")).toBeInTheDocument();
    expect(from).toHaveBeenCalledWith("profiles");
  });

  it("updates display_name only, scoped to own id", async () => {
    const { client, update } = mockClient();
    renderProfile(client);
    fireEvent.change(await screen.findByLabelText("ชื่อที่แสดง"), { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึก" }));
    expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({ display_name: "New Name" });
    const eq = (update.mock.results[0]?.value as { eq: ReturnType<typeof vi.fn> }).eq;
    expect(eq).toHaveBeenCalledWith("id", "user-a");
  });

  it("validates display name length", async () => {
    const { client, update } = mockClient();
    renderProfile(client);
    fireEvent.change(await screen.findByLabelText("ชื่อที่แสดง"), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึก" }));
    expect(screen.getByRole("alert")).toHaveTextContent("2–24");
    expect(update).not.toHaveBeenCalled();
  });

  it("reports load and save errors", async () => {
    renderProfile(mockClient({ loadError: true }).client);
    expect(await screen.findByRole("alert")).toHaveTextContent("โหลดโปรไฟล์ไม่สำเร็จ");
  });

  it("reports save errors", async () => {
    renderProfile(mockClient({ saveError: true }).client);
    fireEvent.change(await screen.findByLabelText("ชื่อที่แสดง"), { target: { value: "Valid" } });
    fireEvent.click(screen.getByRole("button", { name: "บันทึก" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("บันทึกไม่สำเร็จ");
    });
  });
});
