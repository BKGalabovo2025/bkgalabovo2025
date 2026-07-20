import { devices, expect, test } from '@playwright/test';

test.describe('Visual & Responsive Testing', () => {
  const viewports = [
    { name: 'Desktop', ...devices['Desktop Chrome'] },
    { name: 'Mobile', ...devices['iPhone 14'] },
  ];

  const themes = ['light', 'dark'];

  for (const viewport of viewports) {
    for (const theme of themes) {
      test(`Visual regression check - ${viewport.name} (${theme})`, async ({ page }) => {
        await page.setViewportSize(viewport.viewport);

        // Navigate and set theme
        await page.goto('/');
        await page.evaluate((t) => {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(t);
        }, theme);

        // Wait for animations to settle
        await page.waitForTimeout(1000);

        // Capture screenshot and compare with baseline
        await expect(page).toHaveScreenshot(`${viewport.name}-${theme}-homepage.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.05,
        });
      });
    }
  }

  test('Component Visual: Booking Wizard Header', async ({ page }) => {
    await page.goto('/booking');
    const header = page.locator('header');
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('booking-header.png');
    }
  });
});
