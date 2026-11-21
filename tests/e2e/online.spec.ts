import { expect, test, type Browser, type Page } from "@playwright/test";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

async function player(browser: Browser, name: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill(name);
  await page.getByLabel("อีเมล").fill(`${name.toLowerCase()}${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await page.getByRole("link", { name: "Online" }).click();
  return page;
}

/** One step for this page if it can act now: mulligan, summon/attack, or end turn. */
async function act(page: Page): Promise<boolean> {
  const idle = page.getByRole("button", { name: "กำลังส่ง…" });
  const keep = page.getByRole("button", { name: "เก็บมือนี้" });
  if ((await keep.isVisible()) && (await keep.isEnabled())) {
    await keep.click();
    await expect(idle).toHaveCount(0);
    return true;
  }
  const endTurn = page.getByRole("button", { name: "จบเทิร์น", exact: true });
  if (!(await endTurn.isVisible()) || !(await endTurn.isEnabled())) return false;
  const hand = await page
    .getByRole("group", { name: "Hand" })
    .getByRole("button")
    .and(page.locator(":enabled"))
    .all();
  for (const card of hand) {
    await card.click();
    const summon = page
      .getByRole("group", { name: "Actions" })
      .getByRole("button", { name: "ลงสนาม" });
    if (await summon.isVisible().catch(() => false)) {
      await summon.click();
      await expect(idle).toHaveCount(0);
      return true;
    }
    if (
      await page
        .getByRole("dialog")
        .isVisible()
        .catch(() => false)
    )
      await page.keyboard.press("Escape");
  }
  await endTurn.click();
  await expect(idle).toHaveCount(0);
  return true;
}

test("two browsers 1v1: lobby → ready → start → turns → forfeit", async ({ browser }) => {
  test.setTimeout(240_000);
  const [ann, ben] = await Promise.all([player(browser, "Ann"), player(browser, "Ben")]);

  await ann.getByRole("button", { name: "สร้างห้อง" }).click();
  const code = (await ann.getByLabel("Join code").textContent())?.trim() ?? "";
  expect(code).toMatch(/^[A-Z2-9]{8}$/);

  await ben.getByLabel("รหัสห้อง").fill(code);
  await ben.getByRole("button", { name: "เข้าห้อง" }).click();
  await ben.getByRole("button", { name: "พร้อมเล่น" }).click();

  await expect(ann.getByRole("list", { name: "Lobby players" }).getByText("พร้อม ✅")).toHaveCount(
    2,
  );
  await ann.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(ann).toHaveURL(/\/game\//);
  await expect(ben).toHaveURL(/\/game\//, { timeout: 15_000 });

  // Each browser sees only its own hand; play until a few turns have passed.
  const turn = (p: Page) => p.getByText(/^เทิร์น \d+$/);
  for (let i = 0; i < 120; i++) {
    const text =
      (await turn(ann)
        .textContent()
        .catch(() => "")) ?? "";
    if (Number(/\d+/.exec(text)?.[0] ?? 0) >= 5) break;
    const acted = (await act(ann)) || (await act(ben));
    if (!acted) await ann.waitForTimeout(400);
  }
  await expect(turn(ann)).toHaveText(/เทิร์น ([5-9]|\d{2,})/);

  await ben.getByRole("button", { name: "ตั้งค่า" }).click();
  await ben.getByRole("button", { name: "ยอมแพ้" }).click();
  await ben.getByRole("button", { name: "ยืนยันยอมแพ้" }).click();
  await expect(ben.getByRole("heading", { name: "Ann ชนะ" })).toBeVisible();
  await expect(ann.getByRole("heading", { name: "คุณชนะ! 🎉" })).toBeVisible({ timeout: 15_000 });
});
