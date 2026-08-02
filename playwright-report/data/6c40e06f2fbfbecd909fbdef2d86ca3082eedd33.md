# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 1-auth-guards.spec.ts >> Auth Guards & Routing >> can login with valid credentials and reach dashboard
- Location: e2e\1-auth-guards.spec.ts:16:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/dashboard/
Received string:  "http://localhost:9001/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:9001/login"

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
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | // This test doesn't use the setup auth state because we want to test unauthenticated access
  4  | test.use({ storageState: { cookies: [], origins: [] } });
  5  | 
  6  | test.describe("Auth Guards & Routing", () => {
  7  |   test("unauthenticated user is redirected to /login when accessing protected route", async ({ page }) => {
  8  |     await page.goto("/dashboard");
  9  |     // Should be redirected to login
  10 |     await expect(page).toHaveURL(/.*\/login/);
  11 |     
  12 |     await page.goto("/members");
  13 |     await expect(page).toHaveURL(/.*\/login/);
  14 |   });
  15 | 
  16 |   test("can login with valid credentials and reach dashboard", async ({ page }) => {
  17 |     // We can use the admin credentials created in setup
  18 |     await page.goto("/login");
  19 |     await page.fill('input[type="email"]', "admin@bkgalabovo.com");
  20 |     await page.fill('input[type="password"]', "password123");
  21 |     await page.click('button[type="submit"]');
  22 | 
> 23 |     await expect(page).toHaveURL(/.*\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  24 |     await expect(page.locator("text=Табло")).toBeVisible();
  25 |   });
  26 | });
  27 | 
```