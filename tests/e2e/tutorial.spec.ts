import { expect, test, type Page } from "@playwright/test";

/** The tutorial runs locally (no backend): finish all 7 steps. */
async function playCard(page: Page, ability: boolean) {
  await page.getByRole("group", { name: "Hand" }).locator('[data-playable="true"]').first().click();
  const box = page.getByRole("checkbox");
  if (await box.isVisible().catch(() => false)) await box.setChecked(ability);
  await page.getByRole("button", { name: /^ลงไพ่/ }).click();
}

async function next(page: Page) {
  await expect(page.getByText("เยี่ยม! ✅")).toBeVisible();
  await page.getByRole("button", { name: /ต่อไป|จบการฝึก/ }).click();
}

test("interactive tutorial: 7 steps from first card to win", async ({ page }) => {
  await page.goto("/tutorial");
  await expect(page.getByRole("heading", { name: /ฝึกเล่น 1\/7/ })).toBeVisible();
  await playCard(page, false); // 1 play
  await next(page);
  await page.getByRole("button", { name: "จั่วไพ่" }).click(); // 2 draw
  await next(page);
  await page.getByRole("button", { name: "จั่วไพ่" }).click(); // 3 draw then play
  await page.getByRole("button", { name: "ลงใบที่จั่ว" }).click();
  await page.getByRole("button", { name: /^ลงไพ่/ }).click();
  await next(page);
  await playCard(page, true); // 4 Key ability
  await next(page);
  await page.getByRole("group", { name: "Hand" }).locator('[data-playable="true"]').first().click();
  await page.getByRole("checkbox").setChecked(true); // 5 Glue on the bot
  await page.getByRole("button", { name: "ลงไพ่ ใส่ Bot" }).click();
  await next(page);
  await playCard(page, false); // 6 pile reset
  await next(page);
  await playCard(page, false); // 7 win
  await next(page);
  await expect(page.getByRole("heading", { name: /พร้อมเล่นแล้ว/ })).toBeVisible();
});
