import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { expect, test as setup } from "@playwright/test";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../.auth/user.json");
fs.mkdirSync(path.dirname(authFile), { recursive: true });

setup("authenticate as admin", async ({ page }) => {
  const projectId = "bkgalabovo-test";
  const authEmulatorHost = "127.0.0.1:9099";
  const email = "admin@bkgalabovo.com";
  const password = "password123";

  process.env.FIREBASE_AUTH_EMULATOR_HOST = authEmulatorHost;
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";

  // 1. Initialize Firebase Admin for Emulator
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminSdk: any = admin.apps ? admin : (admin as any).default || admin;
  if (!adminSdk.apps?.length) {
    adminSdk.initializeApp({ projectId });
  }

  const auth = adminSdk.auth();

  // 2. Ensure user exists with admin claims in emulator
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: "Admin User",
    });
  }

  await auth.setCustomUserClaims(userRecord.uid, {
    admin: true,
    allowedSites: ["bkgalabovo", "recoveryzone"],
  });

  // 3. Perform the UI login
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait until the dashboard loads (which indicates successful login)
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 25000 });

  // 4. Save the state
  await page.context().storageState({ path: authFile });
});
