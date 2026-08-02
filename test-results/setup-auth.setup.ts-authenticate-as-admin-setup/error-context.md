# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: setup\auth.setup.ts >> authenticate as admin
- Location: e2e\setup\auth.setup.ts:9:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/dashboard/
Received string:  "http://localhost:9001/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:9001/login"

```

```yaml
- link "Обратно към порталите":
  - /url: /
- heading "Админ Портал" [level=1]
- paragraph: Бадминтон Клуб Гълъбово
- text: Имейл
- textbox "Имейл":
  - /placeholder: admin@bkgalabovo.com
  - text: admin@bkgalabovo.com
- text: Парола
- link "Забравена парола?":
  - /url: "#"
- textbox "Парола": password123
- paragraph: Възникна системна грешка при вход. Моля, опитайте по-късно.
- button "Влез в системата"
- paragraph: Система за управление на спортен клуб и възстановителен център
- paragraph: © 2026 БК Гълъбово & Recovery Zone by ZM
- region "Notifications alt+T":
  - list:
    - listitem:
      - button "Close toast":
        - img
      - img
      - text: Грешка при вход Възникна системна грешка при вход. Моля, опитайте по-късно.
- alert
```

# Test source

```ts
  1  | import { test as setup, expect } from "@playwright/test";
  2  | import { fileURLToPath } from "url";
  3  | import * as path from "path";
  4  | 
  5  | const __filename = fileURLToPath(import.meta.url);
  6  | const __dirname = path.dirname(__filename);
  7  | const authFile = path.join(__dirname, "../.auth/user.json");
  8  | 
  9  | setup("authenticate as admin", async ({ page }) => {
  10 |   // We use the REST API of the emulator to create a user since we don't have direct access
  11 |   // to firebase-admin in the browser context easily without setting up the app config.
  12 |   // Actually, we can just hit the Next.js API route if we had one, or we can just try to sign up via REST.
  13 | 
  14 |   const projectId = "bkgalabovo-test";
  15 |   const authEmulatorHost = "127.0.0.1:9099";
  16 |   const email = "admin@bkgalabovo.com";
  17 |   const password = "password123";
  18 | 
  19 |   // 1. Clear emulator data (optional but good for a fresh start)
  20 |   try {
  21 |     // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
  22 |     await fetch(
  23 |       `http://${authEmulatorHost}/emulator/v1/projects/${projectId}/accounts`,
  24 |       {
  25 |         method: "DELETE",
  26 |       }
  27 |     );
  28 |   } catch (e) {
  29 |     console.log("Could not clear auth emulator, it might be fresh.", e);
  30 |   }
  31 | 
  32 |   // 2. Create the user
  33 |   try {
  34 |     // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
  35 |     await fetch(
  36 |       `http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:signUp?key=fake-api-key`,
  37 |       {
  38 |         method: "POST",
  39 |         headers: { "Content-Type": "application/json" },
  40 |         body: JSON.stringify({
  41 |           email,
  42 |           password,
  43 |           returnSecureToken: true,
  44 |         }),
  45 |       }
  46 |     );
  47 | 
  48 |     // 3. Set custom claims (admin = true, allowedSites = ["bkgalabovo"])
  49 |     // The emulator provides a specific endpoint for updating user accounts in emulator mode.
  50 |     // However, the easiest way to ensure the user has claims is to use a specific test endpoint if it exists,
  51 |     // or we can mock the server action to always succeed if it's the emulator.
  52 |     // Wait, the Next.js loginAction might actually verify claims! Let's just login and see.
  53 |     // In our loginAction it verifies the user. If the user doesn't have claims, they might not see everything.
  54 |     // Let's set custom claims using the Auth Emulator Custom Claims REST API:
  55 |     // Actually, we can just use the standard identitytoolkit endpoint if we had the ID token.
  56 |     // But setting claims requires Admin SDK.
  57 |     // Playwright Node.js context CAN run firebase-admin! Let's do it properly!
  58 | 
  59 |     const admin = await import("firebase-admin");
  60 |     if (!admin.apps.length) {
  61 |       process.env.FIREBASE_AUTH_EMULATOR_HOST = authEmulatorHost;
  62 |       admin.initializeApp({ projectId });
  63 |     }
  64 | 
  65 |     const userRecord = await admin
  66 |       .auth()
  67 |       .getUserByEmail(email)
  68 |       .catch(async () => {
  69 |         return await admin.auth().createUser({ email, password });
  70 |       });
  71 | 
  72 |     await admin.auth().setCustomUserClaims(userRecord.uid, {
  73 |       admin: true,
  74 |       allowedSites: ["bkgalabovo"],
  75 |     });
  76 |   } catch (e) {
  77 |     console.error("Setup error:", e);
  78 |   }
  79 | 
  80 |   // 4. Perform the UI login
  81 |   await page.goto("/login");
  82 |   await page.fill('input[type="email"]', email);
  83 |   await page.fill('input[type="password"]', password);
  84 |   await page.click('button[type="submit"]');
  85 | 
  86 |   // Wait until the dashboard loads (which indicates successful login)
> 87 |   await expect(page).toHaveURL(/.*\/dashboard/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  88 | 
  89 |   // 5. Save the state
  90 |   await page.context().storageState({ path: authFile });
  91 | });
  92 | 
```