import { expect, test } from "@playwright/test";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

test("pass & play: 2 local seats with privacy handoff play to the end", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("Host");
  await page.getByLabel("อีเมล").fill(`pp${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await page.getByRole("link", { name: "Pass & Play" }).click();
  await expect(page.getByText(/เล่นบนเครื่องเดียวกัน/)).toBeVisible(); // 5.4 notice
  await page
    .getByRole("group", { name: "ตัวละครที่นั่ง 1" })
    .getByRole("button", { name: /ปิโร่/ })
    .click();
  await page
    .getByRole("group", { name: "ตัวละครที่นั่ง 2" })
    .getByRole("button", { name: /บรีซ/ })
    .click();
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page).toHaveURL(/\/match\//);

  const result = page.getByRole("heading", { name: /ชนะ|เสมอ/ });
  for (let turn = 0; turn < 120; turn++) {
    if (await result.isVisible()) break;
    const reveal = page.getByRole("button", { name: /แสดงการ์ด/ });
    await expect(reveal.or(result)).toBeVisible();
    if (await result.isVisible()) break;
    // Before the handoff no hand is on screen (5.3)
    await expect(page.getByRole("group", { name: "Hand" })).toHaveCount(0);
    await reveal.click();
    const card = page.getByRole("group", { name: "Hand" }).getByRole("button").first();
    await card.click();
    const target = page.getByRole("group", { name: "Target" }).getByRole("button").first();
    if (await target.isVisible().catch(() => false)) await target.click();
    const draw = page.getByRole("button", { name: "จั่วการ์ด" });
    if (await draw.isVisible().catch(() => false)) await draw.click();
    await page.getByRole("button", { name: "ยืนยันการ์ด (คว่ำหน้า)" }).click();
    await expect(page.getByRole("button", { name: "กำลังส่ง…" })).toHaveCount(0);
  }
  await expect(result).toBeVisible();
});
