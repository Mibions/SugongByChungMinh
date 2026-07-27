import { expect, test } from "@playwright/test";

test("admin page exposes the secure token login", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Quản trị SUGONG" })).toBeVisible();
  await expect(page.getByLabel("Master token")).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Đăng nhập an toàn" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("admin login remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Quản trị SUGONG" })).toBeVisible();
  await expect(page.getByLabel("Master token")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
