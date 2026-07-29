import { test, expect } from "@playwright/test";

// This test doesn't use the setup auth state because we want to test unauthenticated access
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Auth Guards & Routing", () => {
  test("unauthenticated user is redirected to /login when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard");
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/);
    
    await page.goto("/members");
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("can login with valid credentials and reach dashboard", async ({ page }) => {
    // We can use the admin credentials created in setup
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@bkgalabovo.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator("text=Табло")).toBeVisible();
  });
});
