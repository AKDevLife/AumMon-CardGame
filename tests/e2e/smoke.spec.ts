import { devices, expect, test } from "@playwright/test";

const PAGES = [
  { path: "/", heading: "AumMon" },
  { path: "/login", heading: "เข้าสู่ระบบ" },
  { path: "/register", heading: "สมัครสมาชิก" },
];

const backend = Boolean(process.env["VITE_SUPABASE_URL"]);

for (const { path, heading } of PAGES) {
  test(`${path} renders${backend ? "" : " with preview banner"}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    if (!backend) await expect(page.getByRole("status")).toContainText("ยังไม่เชื่อมระบบจริง");
  });
}

test.describe("iPhone viewport", () => {
  // iPhone 13 metrics on Chromium (WebKit is not installed in CI).
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices["iPhone 13"];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

  for (const { path } of PAGES) {
    test(`${path} has no horizontal scroll`, async ({ page }, testInfo) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await page.screenshot({ path: testInfo.outputPath("iphone.png"), fullPage: true });
    });
  }
});
