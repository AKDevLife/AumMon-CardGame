import { expect, test, type Page } from "@playwright/test";
import { act, leave } from "./game-helpers.ts";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

async function signUp(page: Page) {
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("Solo E2E");
  await page.getByLabel("อีเมล").fill(`solo${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await expect(page.getByRole("link", { name: "โปรไฟล์" })).toBeVisible();
}

test("sign up → solo vs 2 paced bots → several turns → leave", async ({ page }) => {
  test.setTimeout(240_000);
  await signUp(page);
  await page.getByRole("link", { name: "Solo vs Bot" }).click();
  await page.getByLabel("จำนวน Bot").selectOption("2");
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page).toHaveURL(/\/game\//);
  await expect(page.getByRole("list", { name: "ผู้เล่น" }).getByRole("listitem")).toHaveCount(3);

  let mine = 0;
  let sawBot = false;
  for (let i = 0; i < 300 && mine < 3; i++) {
    if (await page.getByRole("heading", { name: /ชนะ/ }).isVisible()) break;
    if (
      await page
        .getByText(/กำลังเล่น…/)
        .isVisible()
        .catch(() => false)
    )
      sawBot = true;
    if (await act(page)) mine++;
    else await page.waitForTimeout(400);
  }
  expect(mine).toBeGreaterThan(0);
  expect(sawBot).toBe(true);
  await expect(page.getByRole("alert")).toHaveCount(0);
  if (!(await page.getByRole("heading", { name: /ชนะ/ }).isVisible())) {
    await leave(page);
    await expect(page).toHaveURL(/\/$/);
  }
});
