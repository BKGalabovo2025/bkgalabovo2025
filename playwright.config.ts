import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    // Use the correct port discovered via lsof
    baseURL: "http://localhost:9001",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use the auth state saved during setup for all tests
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command:
      "cross-env NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true NEXT_PUBLIC_FIREBASE_API_KEY=fake-api-key NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bkgalabovo-test.firebaseapp.com NEXT_PUBLIC_FIREBASE_PROJECT_ID=bkgalabovo-test NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bkgalabovo-test.appspot.com NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789 NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:test FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8081 npm run dev -- -p 9001",
    url: "http://localhost:9001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
