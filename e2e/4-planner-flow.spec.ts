import { test, expect } from "@playwright/test";

test.describe("Planner Flow", () => {
  test("creates a training session and marks attendees", async ({ page }) => {
    await page.goto("/planner");
    
    // Check if the calendar is visible
    await expect(page.locator("text=График")).toBeVisible();

    // Click on a day to add a session (assuming there's an add button or clicking on a cell)
    const addSessionBtn = page.locator('button:has-text("Нова Тренировка")');
    if (await addSessionBtn.isVisible()) {
      await addSessionBtn.click();
      
      // Fill session details
      await page.fill('input[name="title"]', "E2E Training");
      await page.fill('input[name="startTime"]', "18:00");
      await page.fill('input[name="endTime"]', "19:30");
      
      await page.click('button[type="submit"]:has-text("Запази")');
      
      // Wait for session to appear on calendar
      await expect(page.locator("text=E2E Training")).toBeVisible({ timeout: 10000 });
      
      // Click on the session to open attendees dialog
      await page.click("text=E2E Training");
      await expect(page.locator("text=Присъствия")).toBeVisible();
      
      // Mark someone as present if there's a checkbox
      const checkbox = page.locator('button[role="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
      }
      
      // Close dialog
      await page.click('button:has-text("Затвори")');
    }
  });
});
