import { expect, test } from "@playwright/test";

test("landing page renders the AumMon shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "AumMon" })).toBeVisible();
  await expect(page.getByText("Rulebook v1")).toBeVisible();
});
