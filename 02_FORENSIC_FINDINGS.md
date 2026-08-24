# 02_FORENSIC_FINDINGS.md
# ПОДРОБНИ FORENSIC ДОКЛАДИ ЗА ВСЯКО ОТКРИТИЕ

---

### FINDING F-01: Неоторизиран Публичен Достъп до Клиентски Данни през Debug Endpoints
- **ID**: `F-01`
- **Severity**: 🔴 **CRITICAL**
- **Category**: Security / Auth Bypass & Data Leakage
- **Source**: Входящи HTTP заявки от интернет към `/api/debug` и `/api/analyze-reservations`
- **Destination**: `src/app/api/debug/route.ts` и `src/app/api/analyze-reservations/route.ts` -> Firebase Admin SDK (`adminDb.collection("reservations")`)
- **Contract / Interface**:
  - `GET /api/debug` -> `[ { id, client, client2, status, date, package } ]`
  - `GET /api/analyze-reservations` -> Пълен JSON дъм на първите 10 документа от `reservations`
- **Какво очаква архитектурата**: Всички API endpoints, които достъпват базата през Admin SDK, да изискват валиден Bearer token или активна сесия.
- **Какво реално се случва**: Нито един от двата route handler-а не съдържа проверка за `authHeader`, `cookies` или роля. Всеки анонимен потребител или бот може да извлече имена на клиенти и часове на резервации.
- **Доказателство от кода**:
  - `src/app/api/debug/route.ts:14-33`:
    ```ts
    export async function GET() {
      try {
        const db = getAdminDb();
        const snap = await db.collection("reservations").get();
        // Връща JSON с clientName, client2Name, дати и статус
        return NextResponse.json(res);
      }
    }
    ```
  - `src/app/api/analyze-reservations/route.ts:5-16`:
    ```ts
    export async function GET() {
      const adminDb = getAdminDb();
      const snap = await adminDb.collection("reservations").limit(10).get();
      // Връща целия data обект като чист текст
      return new NextResponse(result, { status: 200 });
    }
    ```
- **Потенциален runtime / security ефект**: Нарушение на GDPR и изтичане на лични данни на клиенти на клуба.
- **Confidence**: **CONFIRMED**
- **Препоръка**: Тези два тестови файла да бъдат изтрити или защитени с `ensureAdmin`.

---

### FINDING F-02: Несъответствие в Custom Claims при Multi-tenant Firestore Rules
- **ID**: `F-02`
- **Severity**: 🟠 **HIGH**
- **Category**: Tenant Isolation / Firestore Rules
- **Source**: Client SDK Firestore заявки от обикновени (non-admin) потребители
- **Destination**: `firestore.rules` (функция `hasAccessToSite`)
- **Contract / Interface**:
  ```javascript
  function hasAccessToSite(siteId) {
    return request.auth != null && 
           request.auth.token.allowedSites != null && 
           siteId != null &&
           siteId in request.auth.token.allowedSites;
  }
  ```
- **Какво очаква source**: Клиентът се логва през стандартен Firebase Auth (`signInWithEmailAndPassword`).
- **Какво реално се случва**: По подразбиране стандартният Firebase Auth потребител няма зададен Custom Claim `allowedSites` в токена си, освен ако изрично не е сетнат през Admin SDK script. Ако потребителят не е с имейл `bkgalabovo2014@gmail.com` или `token.admin == true`, всички заявки за четене на колекции от Група 1 (`members`, `events`, `exercises` и др.) ще върнат `Permission Denied` от Firestore rules.
- **Доказателство от кода**:
  - `firestore.rules:17-22`: `request.auth.token.allowedSites != null`
  - `src/lib/actions/auth.ts:24-37`: REST вход не сетва claims на обикновени потребители.
- **Потенциален runtime ефект**: Ако в бъдеще се създадат треньорски или клиентски акаунти без пълен админ достъп, те няма да могат да четат разрешените им ресурси.
- **Confidence**: **CONFIRMED**
- **Препоръка**: Да се добави проверка `request.auth.token.admin == true || hasAccessToSite(siteId)` или автоматичен fallback в правилата.

---

### FINDING F-03: Липсващ Edge Middleware (`proxy.ts` не е `middleware.ts`)
- **ID**: `F-03`
- **Severity**: 🟠 **HIGH**
- **Category**: Server Routing / Security Boundary
- **Source**: Next.js Request Processing Pipeline
- **Destination**: `src/proxy.ts`
- **Contract / Interface**: Next.js изисква файлът да се нарича `src/middleware.ts` (или `middleware.ts` в корена), с експортирана функция `middleware(request)`.
- **Какво очаква source**: Разработчикът е кръстил файла `proxy.ts` и експортира `export function proxy(...)`.
- **Какво реално се случва**: Next.js въобще не зарежда `proxy.ts`. Сървърният редирект при липса на бисквитка не се изпълнява на Edge ниво. Цялата защита се поема на клиентско ниво в `ProtectedLayoutClient.tsx`.
- **Доказателство от кода**: В проекта липсва файл `middleware.ts`.
- **Потенциален runtime ефект**: При отваряне на защитен URL от нелогнат потребител, първоначалният HTML се сервира от сървъра, и чак след зареждане на React в браузъра става редиректът към `/login`.
- **Confidence**: **CONFIRMED**
- **Препоръка**: Преименуване на `src/proxy.ts` на `src/middleware.ts` и `export function middleware`.

---

### FINDING F-04: Публичен Незащитен Seed Endpoint (`/api/seed`)
- **ID**: `F-04`
- **Severity**: 🟡 **MEDIUM**
- **Category**: API Authorization & Data Integrity
- **Source**: Публична GET заявка към `/api/seed`
- **Destination**: `src/app/api/seed/route.ts` -> `plannerService.getExercises` -> `batch.delete` -> `batch.set`
- **Contract / Interface**: `GET /api/seed` -> Изтрива всички съществуващи упражнения в `exercises` и налива наново начални данни.
- **Какво очаква source**: Административен инструмент за начално инициализиране.
- **Какво реално предоставя destination**: Всеки посетител на сайта може да зареди URL-а `https://domain/api/seed` в браузъра си и без парола да изтрие персонализираните упражнения на клуба.
- **Доказателство от кода**:
  - `src/app/api/seed/route.ts:8-37`: Няма никаква проверка на токен или сесия.
- **Потенциален runtime ефект**: Загуба на въведени от треньорите упражнения в планировчика.
- **Confidence**: **CONFIRMED**
- **Препоръка**: Защита с `ensureAdmin` или изтриване на route handler-а (тъй като вече има UI страница в `(protected)/seed/page.tsx`).

---

### FINDING F-05: Слаба Zod Валидация в `/api/send-email`
- **ID**: `F-05`
- **Severity**: 🟡 **MEDIUM**
- **Category**: Weak Contract / Potential Silent Data Loss
- **Source**: Клиентски компоненти изпращащи имейли
- **Destination**: `src/app/api/send-email/route.tsx`
- **Contract / Interface**: `EmailSchema` валидира с `data: z.record(z.string(), z.any())`.
- **Какво реално се случва**: Ако извикващият подаде грешно име на параметър (например `text` вместо `messageText`), Zod няма да хвърли грешка 400, а шаблонът ще генерира имейл с празно или default съдържание.
- **Доказателство от кода**: `src/app/api/send-email/route.tsx:90`.
- **Confidence**: **CONFIRMED**
- **Препоръка**: Използване на `z.discriminatedUnion("template", [...])`.

---

### FINDING F-06: Необработен Провал при Изпращане на Имейл за Резервация
- **ID**: `F-06`
- **Severity**: 🟡 **MEDIUM**
- **Category**: Silent Failure / Error Handling
- **Source**: `src/components/reservations/reservation-dialog/hooks/useReservationSubmit.ts`
- **Destination**: `fetch("/api/send-email", ...)`
- **Доказателство от кода**:
  - Редове 186-205: Извикването на `fetch("/api/send-email")` е 'fire-and-forget' без `await`, без проверка на `response.ok` и без уведомяване на потребителя при грешка.
- **Потенциален runtime ефект**: Ако SMTP сървърът отхвърли писмото, резервацията се записва успешно, но треньорът/клиентът остава в заблуда, че потвърждението е изпратено.
- **Confidence**: **CONFIRMED**
- **Препоръка**: Добавяне на `try/catch` или фонов статус за изпратен имейл в записа на резервацията.
