import { expect, test } from "@playwright/test";

test.describe("Inventory & Sales Flow", () => {
  test("navigates to inventory and validates product view", async ({
    page,
  }) => {
    // Navigate to Inventory
    await page.goto("/inventory");
    await expect(
      page
        .locator("h1:has-text('Инвентар')")
        .or(page.locator("text=Инвентар"))
        .first()
    ).toBeVisible({
      timeout: 15000,
    });

    // Navigate to Sales
    await page.goto("/sales");
    await expect(
      page
        .locator("text=Продажби")
        .or(page.locator("h1:has-text('Продажби')"))
        .first()
    ).toBeVisible({
      timeout: 15000,
    });
  });
});
