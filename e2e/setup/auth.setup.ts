import { test as setup, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate as admin", async ({ page }) => {
  // We use the REST API of the emulator to create a user since we don't have direct access
  // to firebase-admin in the browser context easily without setting up the app config.
  // Actually, we can just hit the Next.js API route if we had one, or we can just try to sign up via REST.

  const projectId = "bkgalabovo-test";
  const authEmulatorHost = "127.0.0.1:9099";
  const email = "admin@bkgalabovo.com";
  const password = "password123";

  // 1. Clear emulator data (optional but good for a fresh start)
  try {
    // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
    await fetch(
      `http://${authEmulatorHost}/emulator/v1/projects/${projectId}/accounts`,
      {
        method: "DELETE",
      }
    );
  } catch (e) {
    console.log("Could not clear auth emulator, it might be fresh.", e);
  }

  // 2. Create the user
  try {
    // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
    await fetch(
      `http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:signUp?key=fake-api-key`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    // 3. Set custom claims (admin = true, allowedSites = ["bkgalabovo"])
    // The emulator provides a specific endpoint for updating user accounts in emulator mode.
    // However, the easiest way to ensure the user has claims is to use a specific test endpoint if it exists,
    // or we can mock the server action to always succeed if it's the emulator.
    // Wait, the Next.js loginAction might actually verify claims! Let's just login and see.
    // In our loginAction it verifies the user. If the user doesn't have claims, they might not see everything.
    // Let's set custom claims using the Auth Emulator Custom Claims REST API:
    // Actually, we can just use the standard identitytoolkit endpoint if we had the ID token.
    // But setting claims requires Admin SDK.
    // Playwright Node.js context CAN run firebase-admin! Let's do it properly!

    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = authEmulatorHost;
      admin.initializeApp({ projectId });
    }

    const userRecord = await admin
      .auth()
      .getUserByEmail(email)
      .catch(async () => {
        return await admin.auth().createUser({ email, password });
      });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      allowedSites: ["bkgalabovo"],
    });
  } catch (e) {
    console.error("Setup error:", e);
  }

  // 4. Perform the UI login
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait until the dashboard loads (which indicates successful login)
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

  // 5. Save the state
  await page.context().storageState({ path: authFile });
});
