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

test("sign up → solo 1v1 vs bot → play until the match ends", async ({ page }) => {
  test.setTimeout(240_000);
  await signUp(page);
  await page.getByRole("link", { name: "Solo vs Bot" }).click();
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page).toHaveURL(/\/game\//);
  await page.getByRole("button", { name: "เก็บมือนี้" }).click();
  await expect(page.getByText(/เทิร์น \d+/)).toBeVisible();

  const result = page.getByRole("heading", { name: /ชนะ|เสมอ/ });
  const idle = page.getByRole("button", { name: "กำลังส่ง…" });
  let summoned = 0;
  for (let step = 0; step < 400; step++) {
    if (await result.isVisible()) break;
    const endTurn = page.getByRole("button", { name: "จบเทิร์น" });
    if (!(await endTurn.isVisible().catch(() => false))) {
      await page.waitForTimeout(500);
      continue;
    }
    // Prefer attacking with a ready unit, else summon a unit from hand, else end the turn.
    const subjects = [
      ...(await page
        .getByRole("group", { name: "Your units" })
        .getByRole("button")
        .and(page.locator(":enabled"))
        .all()),
      ...(await page
        .getByRole("group", { name: "Hand" })
        .getByRole("button")
        .and(page.locator(":enabled"))
        .all()),
    ];
    let acted = false;
    for (const subject of subjects) {
      await subject.click();
      const action = page
        .getByRole("group", { name: "Actions" })
        .getByRole("button", { name: /โจมตี|ลงสนาม/ })
        .first();
      if (await action.isVisible().catch(() => false)) {
        if ((await action.innerText()).includes("ลงสนาม")) summoned++;
        await action.click();
        await expect(idle).toHaveCount(0);
        acted = true;
        break;
      }
    }
    if (!acted) {
      await endTurn.click();
      await expect(idle).toHaveCount(0);
    }
  }
  await expect(result).toBeVisible();
  expect(summoned).toBeGreaterThan(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
