import { test, expect } from "@playwright/test";

test.describe("Members Flow", () => {
  test("creates a new member and verifies it appears in the list", async ({ page }) => {
    // Navigate to members page
    await page.goto("/members");
    await expect(page.locator("text=Играчи").first()).toBeVisible();

    // Open add member dialog
    await page.click('button:has-text("Добави Играч")');
    await expect(page.locator("text=Нов Играч")).toBeVisible();

    // Fill the form
    const uniqueName = `E2E Tester ${Date.now()}`;
    await page.fill('input[name="firstName"]', uniqueName);
    await page.fill('input[name="lastName"]', "Playwright");
    
    // Select gender (assuming Radix UI select)
    await page.click('button[role="combobox"]:has-text("Избери пол")');
    await page.click('div[role="option"]:has-text("Мъж")');
    
    // Date of birth
    await page.fill('input[name="dateOfBirth"]', "2005-05-15");

    // Submit the form
    await page.click('button[type="submit"]:has-text("Запази")');

    // Wait for the dialog to close and the toast to appear
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 });
    
    // Verify the age group tag is present (U19 or Мъже/Жени depending on calculation)
    // 2005 means around 21 years old in 2026, so it should be "Мъже/Жени"
    const row = page.locator(`tr:has-text("${uniqueName}")`);
    await expect(row.locator('text=Мъже/Жени').first()).toBeVisible();
  });
});
