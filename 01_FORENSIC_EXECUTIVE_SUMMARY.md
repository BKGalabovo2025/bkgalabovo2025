# 01_FORENSIC_EXECUTIVE_SUMMARY.md
# FORENSIC AUDIT PASS 2 — EXECUTIVE SUMMARY
## Проект: BKGalabovo2025 (Next.js 16 / Firebase / Multi-tenant Sports Club Platform)

---

### 1. Методология на Втория Проход (Forensic Verification)
Първоначалният предварителен одит идентифицира 5 проблема. При този **втори, независим forensic pass**, всеки един слой на системата беше проверен без допускания:
- Пълен анализ на `firestore.rules` срещу всички 26 колекции и реални операции (`addDoc`, `updateDoc`, `setDoc`, `getDocs`, `batch`).
- Проверка на **Tenant Isolation** между `bkgalabovo` и `recoveryzone`.
- Анализ на Server Actions (`loginAction`), Edge/Proxy middleware, Next.js cookies и Firebase Auth claims (`admin`, `allowedSites`).
- Анализ на всички 15 API Route Handlers в `src/app/api/**` за authentication bypass и липса на authorization.
- Проверка на Zod схеми срещу изпращани обекти от UI компонентите.
- Изпълнение на `npm run check-all` (TypeScript 0 errors, ESLint 0 errors, Knip, Vitest 130/130 passing).

---

### 2. Обобщена Таблица на Откритията (Forensic Findings Matrix)

| ID | Severity | Category | Finding | Status | Confidence |
|---|---|---|---|---|---|
| **F-01** | 🔴 **CRITICAL** | **Security / Auth Bypass** | `/api/debug` и `/api/analyze-reservations` връщат пълни лични данни на клиенти без никаква автентикация през Admin SDK | CONFIRMED | CONFIRMED |
| **F-02** | 🟠 **HIGH** | **Tenant Isolation / Security** | `firestore.rules` изисква `request.auth.token.allowedSites`, но Firebase Auth токените нямат сетнат такъв claim по подразбиране — разчита се на fallback или admin bypass | CONFIRMED | CONFIRMED |
| **F-03** | 🟠 **HIGH** | **Server Routing / Security** | `src/proxy.ts` не е именуван `src/middleware.ts` — Next.js Engine НЕ изпълнява файла като Edge middleware. Защитата на страниците е изцяло клиентска в `ProtectedLayoutClient.tsx` | CONFIRMED | CONFIRMED |
| **F-04** | 🟡 **MEDIUM** | **API Authorization** | `/api/seed` е публично достъпен без автентикация и изпълнява изтриване и презаписване на колекцията `exercises` | CONFIRMED | CONFIRMED |
| **F-05** | 🟡 **MEDIUM** | **Weak Contract / Data Loss** | `/api/send-email` приема `data: z.record(z.string(), z.any())` — грешни имена на полета (напр. `text` вместо `messageText`) водят до празни имейли без грешка | CONFIRMED | CONFIRMED |
| **F-06** | 🟡 **MEDIUM** | **Silent Failures / Missing Rollback** | В `useReservationSubmit.ts` извикването на `/api/send-email` е `fetch().catch(...)` без await/toast при провал на SMTP | CONFIRMED | CONFIRMED |
| **F-07** | 🟢 **LOW** | **Dead / Orphaned Endpoint** | `/api/services/[serviceId]` съществува като REST API, но 100% от UI компонентите четат директно през Firestore Client SDK | CONFIRMED | CONFIRMED |
| **F-08** | 🟢 **LOW** | **Orphaned Stub File** | `/api/analyze-db/route.ts` съдържа само коментар `// Този файл може да бъде изтрит спокойно.` и връща `new Response("OK")` | CONFIRMED | CONFIRMED |
| **F-09** | 🟢 **LOW** | **Collection Naming Ambiguity** | Дублиране на имена за сесии: `training_sessions` в Планировчика срещу `sessions` в `club-service.ts` (Legacy RecoveryZone) | CONFIRMED | CONFIRMED |
| **F-10** | 🟢 **LOW** | **Dual Path Creation** | `/api/members` (сървърен POST endpoint) дублира функционалността на `addMember()` в `member-service.ts`, но UI ползва само директния Client SDK | CONFIRMED | CONFIRMED |

---

### 3. Статистическо Резюме

- **Общ брой анализирани файлове**: **474 файла** в `src/`
- **Общ брой открити несъответствия**: **10 findings** (вместо 5 от предварителния pass)
- **Разпределение по Severity**:
  - 🔴 **CRITICAL**: **1**
  - 🟠 **HIGH**: **2**
  - 🟡 **MEDIUM**: **3**
  - 🟢 **LOW**: **4**
- **Разпределение по Confidence**:
  - **CONFIRMED**: **10** (100% потвърдени с точни редове от кода)
  - **LIKELY**: **0**
  - **POSSIBLE**: **0**

---

### 4. ТОП 10 Рискове при незабавен Production Release:
1. **Публично изтичане на резервации и имена на клиенти** през `/api/debug` и `/api/analyze-reservations`.
2. **Възможност за нулиране на базата с упражнения** от всеки посетител чрез GET заявка към `/api/seed`.
3. **Липса на Edge Middleware защита** поради неправилното име `proxy.ts` вместо `middleware.ts`.
4. **Несъответствие на Firestore Security Rules при обикновени (non-admin) потребители** без Custom Claim `allowedSites`.
5. **Тихи провали при изпращане на имейл потвърждения** за резервации поради липса на обработка на грешки в `useReservationSubmit.ts`.
6. **Слаба Zod валидация в `/api/send-email`**, позволяваща изпращане на имейли без съдържание при разминаване в имената на параметрите.
7. **Зависимост от валидни SMTP креденшъли** — без тях модулите за маркетинг, командировки и напомняния спират работа.
8. **CRON_SECRET защита в `/api/send-reminders`** работи само в production (`process.env.NODE_ENV === "production"`).
9. **Възможност за разминаване при смяна на клон (branch switching)** ако компонент не се абонира за `activeBranch` промени в Zustand.
10. **Неизползвани API маршрути (`/api/services/[serviceId]`, `/api/analyze-db`)**, които увеличават повърхността за атака.
