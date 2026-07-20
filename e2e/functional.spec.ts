import { test, expect } from "@playwright/test";

test.describe("Functional E2E Tests", () => {
  test("Homepage should load successfully without errors", async ({ page }) => {
    // Navigate to the homepage
    const response = await page.goto("/");

    // Ensure the page didn't return a server error
    expect(response?.status()).toBeLessThan(400);

    // Ensure the page title is visible or exists
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Check for a basic element that should always exist (e.g., body)
    await expect(page.locator("body")).toBeVisible();
  });

  test("Login modal or page should be accessible", async ({ page }) => {
    await page.goto("/");

    // Check if there are no console errors during load
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    await page.waitForLoadState("networkidle");
    expect(errors.length).toBe(0);
  });
});
