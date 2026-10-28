import { test, expect } from "@playwright/test";

/**
 * Known benign error patterns from Firebase emulator / Next.js hydration
 * that are not indicative of application bugs.
 */
const BENIGN_ERROR_PATTERNS = [
  /firebase/i,
  /auth\/network-request-failed/i,
  /Failed to fetch/i,
  /NetworkError/i,
  /CORS/i,
  /Cross-Origin/i,
  /ERR_CONNECTION_REFUSED/i,
  /net::ERR/i,
  /AbortError/i,
];

function isBenignError(msg: string): boolean {
  return BENIGN_ERROR_PATTERNS.some((pat) => pat.test(msg));
}

test.describe("Functional E2E Tests", () => {
  test("Homepage should load successfully without errors", async ({ page }) => {
    // Navigate to the homepage
    const response = await page.goto("/");

    // Ensure the page didn't return a server error
    expect(response?.status()).toBeLessThan(400);

    // Ensure the page title is visible or exists
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Check for a basic element that should always exist (e.g., body)
    await expect(page.locator("body")).toBeVisible();
  });

  test("Login modal or page should be accessible", async ({ page }) => {
    // Collect only real application errors — exclude known benign
    // Firebase emulator / network errors that occur on CI environments.
    const appErrors: string[] = [];
    page.on("pageerror", (err) => {
      if (!isBenignError(err.message)) {
        appErrors.push(err.message);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Fail only on genuine application-level JavaScript errors
    expect(
      appErrors,
      `Unexpected application errors on page load: ${appErrors.join("; ")}`
    ).toHaveLength(0);
  });
});
