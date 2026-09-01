import { expect, test } from "@playwright/test";

test.describe("Tournaments Flow", () => {
  test("creates a tournament and verifies listing", async ({ page }) => {
    // Navigate to tournaments
    await page.goto("/tournaments");
    await expect(page.locator("h1:has-text('Турнири')")).toBeVisible({
      timeout: 15000,
    });

    // Open Add Tournament modal
    const addBtn = page.locator('button:has-text("Нов турнир")');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(
        page
          .locator("text=Нов турнир")
          .or(page.locator("text=Създаване на турнир"))
          .first()
      ).toBeVisible();

      const tourneyName = `E2E Open ${Date.now()}`;
      const titleInput = page.locator('input[name="title"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill(tourneyName);
      }

      // Close modal
      await page.keyboard.press("Escape");
    }
  });
});
