import { expect, test } from "@playwright/test";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

test("a normal player cannot use the admin dashboard", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "เข้าสู่ระบบ" }).last()).toBeVisible();
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("Not Admin");
  await page.getByLabel("อีเมล").fill(`na${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await expect(page.getByRole("link", { name: "โปรไฟล์" })).toBeVisible();
  await page.goto("/admin/players");
  await expect(page.getByRole("alert")).toHaveText("บัญชีนี้ไม่มีสิทธิ์ Admin");
  await expect(page.getByRole("navigation", { name: "Admin sections" })).toHaveCount(0);
});
