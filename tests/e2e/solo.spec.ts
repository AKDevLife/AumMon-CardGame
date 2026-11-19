import { expect, test, type Page } from "@playwright/test";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

async function signUp(page: Page) {
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("Solo E2E");
  await page.getByLabel("อีเมล").fill(`solo${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await expect(page.getByRole("link", { name: "โปรไฟล์" })).toBeVisible();
}

test("sign up → solo vs 1 bot → play until the match ends", async ({ page }) => {
  test.setTimeout(180_000);
  await signUp(page);
  await page.getByRole("link", { name: "Solo vs Bots" }).click();
  await page.getByRole("button", { name: /ปิโร่/ }).click();
  await page.getByRole("button", { name: "1", exact: true }).click();
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page).toHaveURL(/\/match\//);
  await expect(page.getByText(/รอบ \d+/)).toBeVisible();

  const result = page.getByRole("heading", { name: /ชนะ|เสมอ/ });
  for (let turn = 0; turn < 80; turn++) {
    if (await result.isVisible()) break;
    const skip = page.getByRole("button", { name: "ข้าม" });
    if (await skip.isVisible()) {
      await skip.click();
      continue;
    }
    const card = page
      .getByRole("group", { name: "Hand" })
      .getByRole("button")
      .and(page.locator(":enabled"))
      .first();
    if (!(await card.isVisible().catch(() => false))) {
      await page.waitForTimeout(500);
      continue;
    }
    await card.click();
    const target = page.getByRole("group", { name: "Target" }).getByRole("button").first();
    if (await target.isVisible().catch(() => false)) await target.click();
    const draw = page.getByRole("button", { name: "จั่วการ์ด" });
    if (await draw.isVisible().catch(() => false)) await draw.click();
    await page.getByRole("button", { name: "ยืนยันการ์ด (คว่ำหน้า)" }).click();
    await expect(page.getByRole("button", { name: "กำลังส่ง…" })).toHaveCount(0);
  }
  await expect(result).toBeVisible();
  await expect(page.getByRole("list", { name: "Players" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
