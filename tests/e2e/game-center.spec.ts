import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

async function signUp(page: Page) {
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("Center E2E");
  await page.getByLabel("อีเมล").fill(`center${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await expect(page.getByRole("link", { name: "Solo vs Bot" })).toBeVisible();
}

async function myTurn(page: Page) {
  await expect(page.getByRole("timer")).toContainText("ตาคุณ", { timeout: 30_000 });
}

test("hub → Dummy solo → draw + discard → leave", async ({ page }) => {
  test.setTimeout(120_000);
  await signUp(page);
  await page.getByRole("link", { name: "เล่นดัมมี่กับ Bot" }).click();
  await page.getByLabel("จำนวน Bot").selectOption("1");
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page).toHaveURL(/\/games\/dummy\/match\//);
  await expect(page.getByRole("group", { name: "Hand" }).locator(":scope > *")).toHaveCount(11, {
    timeout: 15_000,
  });
  await myTurn(page);
  await page.getByRole("button", { name: "จั่วไพ่" }).click();
  // Play phase: meld / lay off / discard buttons replace draw / pick.
  await expect(page.getByRole("button", { name: "เกิด", exact: true })).toBeVisible();
  await page.getByRole("group", { name: "Hand" }).getByRole("button").first().click();
  await page.getByRole("button", { name: "ทิ้ง", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(axe.violations.filter((v) => v.impact === "critical")).toEqual([]);
  await page.getByRole("button", { name: "ออกจากเกม" }).click();
  await page.getByRole("button", { name: "ยืนยันออกจากเกม" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("hub → Poker solo → act → leave", async ({ page }) => {
  test.setTimeout(120_000);
  await signUp(page);
  await page.getByRole("link", { name: "เล่นโป๊กเกอร์กับ Bot" }).click();
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page).toHaveURL(/\/games\/poker\/match\//);
  await expect(page.getByRole("group", { name: "Hand" }).getByRole("img")).toHaveCount(2, {
    timeout: 15_000,
  });
  await myTurn(page);
  await page.getByRole("button", { name: /^(ผ่าน|ตาม \d+)$/ }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "ออกจากเกม" }).click();
  await page.getByRole("button", { name: "ยืนยันออกจากเกม" }).click();
  await expect(page).toHaveURL(/\/$/);
});
