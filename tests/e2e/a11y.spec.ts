import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/login", "/register", "/privacy", "/terms"];

for (const path of PAGES) {
  test(`${path} has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.flatMap((v) =>
        v.nodes.map((n) => `${v.id}: ${n.target.join(" ")} ${n.any[0]?.message ?? ""}`),
      ),
    ).toEqual([]);
  });
}

test("signed-in screens (setup, lobby, match, profile) have no WCAG 2.1 AA violations", async ({
  page,
}) => {
  test.skip(!process.env["VITE_SUPABASE_URL"], "Supabase backend not configured");
  test.setTimeout(120_000);
  const scan = async (label: string) => {
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      r.violations.flatMap((v) => v.nodes.map((n) => `${label} ${v.id}: ${n.target.join(" ")}`)),
    ).toEqual([]);
  };
  await page.goto("/register");
  await page.getByLabel("ชื่อที่แสดง").fill("A11y");
  await page.getByLabel("อีเมล").fill(`a11y${Date.now()}@test.local`);
  await page.getByLabel("รหัสผ่าน").fill("secret123");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();
  await expect(page.getByRole("link", { name: "โปรไฟล์" })).toBeVisible();
  for (const path of ["/profile", "/play/pass", "/play/online"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await scan(path);
  }
  await page.goto("/play/solo");
  await page.getByRole("button", { name: "เริ่มเกม" }).click();
  await expect(page.getByRole("region", { name: "โต๊ะ" })).toBeVisible();
  await page.waitForTimeout(800);
  await scan("match");
});
