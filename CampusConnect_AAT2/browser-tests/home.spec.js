import { test, expect } from "@playwright/test";

test("home page shows CampusConnect and facilities", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CampusConnect/);
  await expect(page.getByRole("heading", { name: /Make campus work for you/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Campus facilities/i })).toBeVisible();
});

test("student can sign in and view dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("student@campus.test");
  await page.getByLabel("Password").fill("Student@123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Hello, Demo/i })).toBeVisible();
});
