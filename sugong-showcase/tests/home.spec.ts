import { expect, test } from "@playwright/test";

test("home smoke page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "SUGONG" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quà handmade theo cách riêng của bạn" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Khám phá sản phẩm" })).toBeVisible();
});
