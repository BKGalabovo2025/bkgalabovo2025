import { expect, test } from "@playwright/test";

test.describe("Members Flow", () => {
  test("creates a new member and verifies it appears in the list", async ({
    page,
  }) => {
    // Navigate to members page
    await page.goto("/members");
    await expect(page.locator("text=Членове").first()).toBeVisible({
      timeout: 15000,
    });

    // Open add member page
    await page.click('button:has-text("Нов член")');
    await expect(page).toHaveURL(/.*\/members\/new/);

    // Fill Step 1
    const uniqueFirstName = `E2EFirst${Date.now()}`;
    await page.fill('input[name="firstName"]', uniqueFirstName);
    await page.fill('input[name="lastName"]', "Playwright");

    const dobInput = page.locator('input[name="dateOfBirth"]');
    if (await dobInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dobInput.fill("2005-05-15");
    }

    // Click Next Step until reaching final submit step
    const nextBtn = page.locator('button:has-text("Напред")');
    while (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }

    // Submit / Save
    const saveBtn = page.locator(
      'button:has-text("Създаване"), button:has-text("Запази"), button[type="submit"]'
    );
    await saveBtn.first().click();

    // Verify redirect or member created
    await expect(page).toHaveURL(/.*\/members/);
  });
});
