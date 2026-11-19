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

/** One action for this page if it can act now; returns false when nothing to do. */
async function act(page: Page): Promise<boolean> {
  const skip = page.getByRole("button", { name: "ข้าม" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    return true;
  }
  const confirm = page.getByRole("button", { name: "ยืนยันการ์ด (คว่ำหน้า)" });
  if (!(await confirm.isVisible().catch(() => false))) return false;
  await page.getByRole("group", { name: "Hand" }).getByRole("button").first().click();
  const target = page.getByRole("group", { name: "Target" }).getByRole("button").first();
  if (await target.isVisible().catch(() => false)) await target.click();
  const draw = page.getByRole("button", { name: "จั่วการ์ด" });
  if (await draw.isVisible().catch(() => false)) await draw.click();
  await confirm.click();
  await expect(page.getByRole("button", { name: "กำลังส่ง…" })).toHaveCount(0);
  return true;
}

test("two browsers: lobby → ready → start → play to the end", async ({ browser }) => {
  test.setTimeout(240_000);
  const [ann, ben] = await Promise.all([player(browser, "Ann"), player(browser, "Ben")]);

  await ann.getByRole("group", { name: "Character" }).getByRole("button", { name: /ปิโร่/ }).click();
  await ann.getByRole("button", { name: "สร้างห้อง" }).click();
  const code = (await ann.getByLabel("Join code").textContent())?.trim() ?? "";
  expect(code).toMatch(/^[A-Z2-9]{8}$/);

  await ben.getByRole("group", { name: "Character" }).getByRole("button", { name: /บรีซ/ }).click();
  await ben.getByLabel("รหัสห้อง").fill(code);
  await ben.getByRole("button", { name: "เข้าห้อง" }).click();
  await ben.getByRole("button", { name: "พร้อมเล่น" }).click();

  // Owner sees Ben ready via Realtime/polling, then starts.
  await expect(ann.getByRole("list", { name: "Lobby players" }).getByText("พร้อม ✅")).toHaveCount(
    2,
  );
  await ann.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(ann).toHaveURL(/\/match\//);
  await expect(ben).toHaveURL(/\/match\//, { timeout: 15_000 });

  const result = (p: Page) => p.getByRole("heading", { name: /ชนะ|เสมอ/ });
  for (let i = 0; i < 200; i++) {
    if ((await result(ann).isVisible()) && (await result(ben).isVisible())) break;
    const acted = (await act(ann)) || (await act(ben));
    if (!acted) await ann.waitForTimeout(400);
  }
  await expect(result(ann)).toBeVisible();
  await expect(result(ben)).toBeVisible({ timeout: 15_000 });
});
