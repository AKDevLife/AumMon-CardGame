import { expect, type Page } from "@playwright/test";

/** Close an open info popup (Flashlight / Magnifier result) that would block the table. */
export async function closePopups(page: Page): Promise<boolean> {
  const close = page.getByRole("dialog").getByRole("button", { name: "ปิด" }).first();
  if (!(await close.isVisible().catch(() => false))) return false;
  await close.click();
  return true;
}

/** One step for this page if it can act now: Umbrella answer, play a card, or draw & pass. */
export async function act(page: Page): Promise<boolean> {
  const umbrella = page.getByRole("button", { name: "☂️ กางร่มกัน" });
  if (await umbrella.isVisible().catch(() => false)) {
    await umbrella.click();
    await page.waitForTimeout(300);
    return true;
  }
  if (await closePopups(page)) return true;
  const draw = page.getByRole("button", { name: "จั่วแล้วผ่าน" });
  if (!(await draw.isVisible().catch(() => false)) || !(await draw.isEnabled())) return false;
  const card = page.getByRole("group", { name: "Hand" }).locator('[data-playable="true"]').first();
  if (await card.isVisible().catch(() => false)) {
    await card.click();
    const ability = page.getByRole("checkbox");
    if (await ability.isVisible().catch(() => false)) await ability.uncheck();
    const play = page.getByRole("button", { name: "ลงไพ่", exact: true });
    await expect(play).toBeEnabled();
    await play.click();
  } else await draw.click();
  await page.waitForTimeout(300);
  return true;
}

export async function leave(page: Page) {
  while (await closePopups(page)) await page.waitForTimeout(200);
  await page.getByRole("button", { name: "ตั้งค่า" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "ออกจากเกม", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "ยืนยันออกจากเกม" }).click();
}
