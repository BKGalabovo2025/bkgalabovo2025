import { expect, test } from "@playwright/test";

test.describe("Бадминтон клуб Гълъбово Club Management System - Smoke Tests", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/(?:Бадминтон клуб Гълъбово|BK Galabovo)/i);
  });

  test("should redirect to login when accessing protected route without session", async ({
    browser,
  }) => {
    // Create a fresh unauthenticated browser context
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await context.close();
  });
});
