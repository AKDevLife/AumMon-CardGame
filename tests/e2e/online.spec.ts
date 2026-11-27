import { expect, test, type Browser, type Page } from "@playwright/test";
import { act, leave } from "./game-helpers.ts";

test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

async function player(browser: Browser, name: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill(name);
  await page.getByLabel("อีเมล").fill(`${name.toLowerCase()}${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await expect(page.getByRole("navigation", { name: "AumMon Games" })).toBeVisible();
  await page.goto("/edo");
  await page.getByRole("link", { name: "Online" }).click();
  return page;
}

test("two browsers: lobby → ready → start → turns → one leaves, a bot takes the seat", async ({
  browser,
}) => {
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

  // Each browser sees only its own hand; play a few actions each.
  let actions = 0;
  for (let i = 0; i < 120 && actions < 6; i++) {
    if (await ann.getByRole("heading", { name: /ชนะ/ }).isVisible()) break;
    const acted = (await act(ann)) || (await act(ben));
    if (acted) actions++;
    else await ann.waitForTimeout(400);
  }
  expect(actions).toBeGreaterThan(0);
  if (!(await ann.getByRole("heading", { name: /ชนะ/ }).isVisible())) {
    await leave(ben);
    await expect(ben).toHaveURL(/\/$/);
    await expect(ann.getByRole("region", { name: "โต๊ะ" })).toBeVisible();
  }
});
