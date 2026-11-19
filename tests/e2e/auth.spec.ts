import { expect, test } from "@playwright/test";

// Runs only against a configured backend (CI job `e2e-auth` starts local Supabase).
test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

test("sign up → profile → logout → login", async ({ page }) => {
  const email = `e2e${Date.now()}@test.local`;

  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("E2E Player");
  await page.getByLabel("อีเมล").fill(email);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("status")).toHaveCount(0); // no preview banner

  await page.getByRole("link", { name: "โปรไฟล์" }).click();
  const name = page.getByLabel("ชื่อที่แสดง");
  await expect(name).toHaveValue("E2E Player");
  await name.fill("Renamed");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page.getByText("บันทึกแล้ว")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("ชื่อที่แสดง")).toHaveValue("Renamed");

  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(
    page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "เข้าสู่ระบบ" }),
  ).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("อีเมล").fill(email);
  await page.getByLabel("รหัสผ่าน").fill("wrong-pass");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page.getByRole("alert")).toHaveText("อีเมลหรือรหัสผ่านไม่ถูกต้อง");

  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await expect(page.getByRole("link", { name: "โปรไฟล์" })).toBeVisible();
});
