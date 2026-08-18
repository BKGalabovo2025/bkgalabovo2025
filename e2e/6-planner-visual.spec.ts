import { test, expect } from "@playwright/test";

test.describe("Planner Visual Tests", () => {
  // Use a fixed time so "Today" is always the same date in the UI
  test.use({
    // We set the time to Monday, August 10, 2026 at 12:00 PM UTC
    // This ensures that "Current", "Upcoming" tabs and calendar grid render deterministically
    // We also use a wide viewport to ensure no responsive shifts occur
    viewport: { width: 1280, height: 1024 },
  });

  test.beforeEach(async ({ page }) => {
    // Freeze time
    await page.clock.setFixedTime(new Date("2026-08-10T12:00:00Z"));
  });

  test("visually compares the main schedule view", async ({ page }) => {
    // Navigate to the planner (schedule)
    await page.goto("/schedule");

    // Wait for the main elements to load (e.g. tabs, page header)
    await expect(page.locator("h1:has-text('График')")).toBeVisible();

    // Wait for loading spinners to disappear
    await expect(page.locator(".animate-spin")).toHaveCount(0);

    // Optional: wait a bit for any layout shifts/animations to finish
    await page.waitForTimeout(1000);

    // Take a component-level screenshot of the main content area (to ignore header/sidebar if any)
    // The main wrapper in /schedule/page.tsx is <main className="pb-12">
    const scheduleComponent = page.locator("main");

    // Assert visual comparison
    await expect(scheduleComponent).toHaveScreenshot("schedule-main-view.png", {
      // 5% max threshold is defined globally in playwright.config.ts,
      // but we can also set mask properties here if needed (e.g. to mask dynamically generated IDs)
    });
  });
});
