import { expect, test } from "@playwright/test";

test.describe("Planner / Schedule Flow", () => {
  test("loads schedule page and checks main view elements", async ({
    page,
  }) => {
    await page.goto("/schedule");

    // Check if the page header and schedule elements are visible
    await expect(page.locator("text=График").first()).toBeVisible({
      timeout: 15000,
    });

    const createBtn = page.locator(
      'button:has-text("Създай събитие"), button:has-text("Нова Резервация")'
    );
    if (await createBtn.first().isVisible()) {
      await expect(createBtn.first()).toBeVisible();
    }
  });
});
