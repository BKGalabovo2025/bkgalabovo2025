import { test, expect } from "@playwright/test";

test.describe("Бадминтон клуб Гълъбово Club Management System - Smoke Tests", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Бадминтон клуб Гълъбово/i);
  });

  test("should redirect to login when accessing protected route", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
