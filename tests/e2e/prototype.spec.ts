import { expect, test } from "@playwright/test";

test("BLUFF prototype is clickable end to end on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/prototype/bluff");
  await page.getByLabel("ชื่อเล่น").fill("ออม");
  for (const name of [
    "สร้างห้อง",
    "เริ่มเกม",
    "ต่อไป",
    "ไม่ประกาศ",
    "B มาม่าต้มยำ",
    "A",
    "ล็อก",
    "ดูคะแนน",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  await expect(page.getByText("ทายใจห้องถูก!")).toBeVisible();
  await page.getByRole("button", { name: /ผลสุดท้าย/ }).click();
  await expect(page.getByRole("list", { name: "อันดับ" })).toContainText("ออม");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
