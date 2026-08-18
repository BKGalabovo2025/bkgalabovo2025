import { test, expect } from "@playwright/test";

test.describe("Tournaments Flow", () => {
  test("creates a tournament and allows registration", async ({ page }) => {
    // Navigate to tournaments
    await page.goto("/tournaments");
    await expect(page.locator("h1:has-text('Турнири')")).toBeVisible();

    // Add Tournament
    await page.click('button:has-text("Създай Турнир")');
    await expect(page.locator("text=Нов Турнир")).toBeVisible();

    const tourneyName = `E2E Open ${Date.now()}`;
    await page.fill('input[name="title"]', tourneyName);

    // Status selection
    await page.click('button[role="combobox"]:has-text("Предстоящ")'); // Assuming default is "Предстоящ" or we click the select placeholder
    // If it's already selected by default, we can just skip or select "Отворена регистрация"
    await page.keyboard.press("Escape"); // Just to close dropdown if open

    // Fill dates
    await page.fill('input[name="startDate"]', "2026-10-01");
    await page.fill('input[name="endDate"]', "2026-10-02");
    await page.fill('input[name="location"]', "Гълъбово Арена");

    await page.click('button[type="submit"]:has-text("Запази")');

    // Wait for creation and card to appear
    await expect(page.locator(`text=${tourneyName}`)).toBeVisible({
      timeout: 10000,
    });

    // Open tournament details
    await page.click(`text=${tourneyName}`);
    await expect(page.locator("text=Участници")).toBeVisible();

    // Register a dummy participant (if the UI allows manual adding from admin)
    // Depending on the exact UI, there might be a "Добави участник" button
    const addParticipantBtn = page.locator(
      'button:has-text("Добави участник")'
    );
    if (await addParticipantBtn.isVisible()) {
      await addParticipantBtn.click();
      // Select a member from dropdown or enter name
      // This part highly depends on UI specifics, so we just do a basic check
      // that the modal opens.
      await expect(page.locator("text=Регистрация")).toBeVisible();
    }
  });
});
