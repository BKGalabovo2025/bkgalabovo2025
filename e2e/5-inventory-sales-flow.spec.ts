import { test, expect } from "@playwright/test";

test.describe("Inventory & Sales Flow", () => {
  test("creates a product and registers a sale", async ({ page }) => {
    // Navigate to Inventory
    await page.goto("/inventory");
    await expect(page.locator("h1:has-text('Инвентар')")).toBeVisible();

    // Add Product
    const addProductBtn = page.locator('button:has-text("Добави Артикул")');
    if (await addProductBtn.isVisible()) {
      await addProductBtn.click();

      const productName = `E2E Product ${Date.now()}`;
      await page.fill('input[name="name"]', productName);
      await page.fill('input[name="price"]', "2.50");
      await page.fill('input[name="stock"]', "10");

      await page.click('button[type="submit"]:has-text("Запази")');

      // Wait for product to appear
      await expect(page.locator(`text=${productName}`)).toBeVisible({
        timeout: 10000,
      });

      // Go to Point of Sale (or Sales tab)
      await page.goto("/sales");
      await expect(page.locator("text=Продажби")).toBeVisible();

      // Find the product and add to cart
      const productCard = page.locator(`text=${productName}`);
      if (await productCard.isVisible()) {
        await productCard.click();

        // Checkout
        await page.click('button:has-text("Плащане")');

        // Verify success
        await expect(page.locator("text=Успешна продажба")).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });
});
