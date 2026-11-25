import { expect, test, type Browser, type Page } from "@playwright/test";

// v2 guest flow against the local backend (CI job "Backend + E2E"; the backend suite approves
// part of the seed pack first). Phone viewport, no e-mail, join by link.
test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");

async function phone(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
  return context.newPage();
}

test("two guests: create → join by link → claim → lock → reveal", async ({ browser }) => {
  test.setTimeout(120_000);
  const a = await phone(browser);
  await a.goto("/");
  await a.getByLabel("ชื่อเล่น").fill("ออม");
  await a.getByRole("button", { name: "สร้างห้อง" }).click();
  await expect(a).toHaveURL(/\/party\/lobby\//);
  const code = (await a.getByLabel("Join code").textContent())?.trim() ?? "";
  expect(code).toMatch(/^[A-Z0-9]{8}$/);

  const b = await phone(browser);
  await b.goto(`/join/${code}`);
  await b.getByLabel("ชื่อเล่น").fill("บอส");
  await b.getByRole("button", { name: "เข้าห้อง" }).click();
  await expect(b).toHaveURL(/\/party\/lobby\//);
  await b.getByRole("button", { name: "พร้อมเล่น" }).click();

  await expect(a.getByRole("list", { name: "ผู้เล่น" })).toContainText("บอส");
  await a.getByRole("button", { name: "เริ่มเกม" }).click();
  for (const p of [a, b]) await expect(p).toHaveURL(/\/party\/game\//, { timeout: 15_000 });

  // Read (6 s) → claim: buttons show the option text.
  for (const p of [a, b])
    await expect(p.getByRole("button", { name: /ฉันเลือก A/ })).toBeVisible({ timeout: 20_000 });
  await a.getByRole("button", { name: /ฉันเลือก B/ }).click();
  await b.getByRole("button", { name: "ไม่ประกาศ" }).click();

  for (const p of [a, b]) {
    await expect(p.getByRole("button", { name: "ล็อก" })).toBeVisible({ timeout: 15_000 });
    await p.getByRole("button", { name: /^A / }).click();
    await p.getByRole("button", { name: "A", exact: true }).click();
    await p.getByRole("button", { name: "ล็อก" }).click();
  }
  for (const p of [a, b]) {
    await expect(p.getByRole("list", { name: "ใครโกหก" })).toBeVisible({ timeout: 15_000 });
    await expect(p.getByRole("list", { name: "ใครโกหก" })).toContainText("โกหก!");
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  }
});
