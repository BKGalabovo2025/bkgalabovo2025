# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 1-auth-guards.spec.ts >> Auth Guards & Routing >> unauthenticated user is redirected to /login when accessing protected route
- Location: e2e\1-auth-guards.spec.ts:7:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:9001/members", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e15]:
    - link "Обратно към порталите" [ref=e16] [cursor=pointer]:
      - /url: /
      - img [ref=e17]
      - text: Обратно към порталите
    - generic [ref=e19]:
      - generic [ref=e20]:
        - img [ref=e22]
        - heading "Админ Портал" [level=1] [ref=e25]
        - paragraph [ref=e26]: Бадминтон Клуб Гълъбово
      - generic [ref=e27]:
        - generic [ref=e28]:
          - text: Имейл
          - textbox "Имейл" [ref=e29]:
            - /placeholder: admin@bkgalabovo.com
        - generic [ref=e30]:
          - generic [ref=e31]:
            - generic [ref=e32]: Парола
            - link "Забравена парола?" [ref=e33] [cursor=pointer]:
              - /url: "#"
          - textbox "Парола" [ref=e34]
        - button "Влез в системата" [ref=e35]
      - paragraph [ref=e37]: Система за управление на спортен клуб и възстановителен център
    - paragraph [ref=e38]: © 2026 БК Гълъбово & Recovery Zone by ZM
  - region "Notifications alt+T"
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
> 12 |     await page.goto("/members");
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
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
  23 |     await expect(page).toHaveURL(/.*\/dashboard/);
  24 |     await expect(page.locator("text=Табло")).toBeVisible();
  25 |   });
  26 | });
  27 | 
```