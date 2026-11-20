import { expect, test } from "@playwright/test";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

test("pass & play 1v1: privacy handoff between turns, then forfeit ends the match", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("Host");
  await page.getByLabel("อีเมล").fill(`pp${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await page.getByRole("link", { name: "Pass & Play" }).click();
  await expect(page.getByText(/เล่นบนเครื่องเดียวกัน/)).toBeVisible();
  await page.getByLabel("ชื่อผู้เล่น 1").fill("Ann");
  await page.getByLabel("ชื่อผู้เล่น 2").fill("Ben");
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page).toHaveURL(/\/game\//);

  const result = page.getByRole("heading", { name: /ชนะ|เสมอ/ });
  const idle = page.getByRole("button", { name: "กำลังส่ง…" });
  let handoffs = 0;
  // A full 1v1 game is long; check several handoffs/turns (incl. mulligans), then forfeit.
  for (let step = 0; step < 120 && handoffs < 5; step++) {
    if (await result.isVisible()) break;
    const reveal = page.getByRole("button", { name: /แสดงการ์ด/ });
    if ((await reveal.isVisible()) && (await reveal.isEnabled())) {
      await expect(page.getByRole("group", { name: "Hand" })).toHaveCount(0); // nothing private before handoff
      await reveal.click();
      await expect(page.getByRole("group", { name: "Hand" })).toBeVisible();
      handoffs++;
      continue;
    }
    const keep = page.getByRole("button", { name: "เก็บมือนี้" });
    if ((await keep.isVisible()) && (await keep.isEnabled())) {
      await keep.click();
      await expect(idle).toHaveCount(0);
      continue;
    }
    const unit = page
      .getByRole("group", { name: "Your units" })
      .getByRole("button")
      .and(page.locator(":enabled"))
      .first();
    const hand = page
      .getByRole("group", { name: "Hand" })
      .getByRole("button")
      .and(page.locator(":enabled"))
      .first();
    let acted = false;
    for (const subject of [unit, hand]) {
      if (!(await subject.isVisible().catch(() => false))) continue;
      await subject.click();
      const action = page
        .getByRole("group", { name: "Actions" })
        .getByRole("button", { name: /โจมตี|ลงสนาม/ })
        .first();
      if (await action.isVisible().catch(() => false)) {
        await action.click();
        await expect(idle).toHaveCount(0);
        acted = true;
        break;
      }
    }
    if (!acted) {
      const endTurn = page.getByRole("button", { name: "จบเทิร์น" });
      if (await endTurn.isVisible().catch(() => false)) {
        await endTurn.click();
        await expect(idle).toHaveCount(0);
      } else await page.waitForTimeout(300);
    }
  }
  if (handoffs < 5) console.log("PASSPLAY-STUCK", await page.locator("main").innerText());
  expect(handoffs).toBe(5);
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "ยอมแพ้" }).click();
  await expect(result).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
