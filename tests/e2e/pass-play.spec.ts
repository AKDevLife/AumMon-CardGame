import { expect, test } from "@playwright/test";
import { act, leave } from "./game-helpers.ts";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

test("pass & play with 3 players: privacy handoff between turns, then leave", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("Host");
  await page.getByLabel("อีเมล").fill(`pp${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await page.getByRole("link", { name: "Pass & Play" }).click();
  await page.getByLabel("ชื่อผู้เล่น 1").fill("Ann");
  await page.getByLabel("ชื่อผู้เล่น 2").fill("Ben");
  await page.getByLabel("ชื่อผู้เล่น 3").fill("Cid");
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page).toHaveURL(/\/game\//);

  let handoffs = 0;
  for (let step = 0; step < 120 && handoffs < 4; step++) {
    if (await page.getByRole("heading", { name: /ชนะ/ }).isVisible()) break;
    const reveal = page.getByRole("button", { name: /แสดงการ์ด/ });
    if ((await reveal.isVisible()) && (await reveal.isEnabled())) {
      await expect(page.getByRole("group", { name: "Hand" })).toHaveCount(0); // nothing private before handoff
      await reveal.click();
      await expect(page.getByRole("group", { name: "Hand" })).toBeVisible();
      handoffs++;
      continue;
    }
    if (!(await act(page))) await page.waitForTimeout(300);
  }
  expect(handoffs).toBeGreaterThanOrEqual(2);
  if (!(await page.getByRole("heading", { name: /ชนะ/ }).isVisible())) {
    await page
      .getByRole("button", { name: /แสดงการ์ด/ })
      .click()
      .catch(() => undefined);
    await leave(page);
    await expect(page).toHaveURL(/\/$/);
  }
});
