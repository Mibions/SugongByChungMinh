import { expect, test } from "@playwright/test";

test("home smoke page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "SUGONG" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nền Astro cho SUGONG đã sẵn sàng" })).toBeVisible();
});
