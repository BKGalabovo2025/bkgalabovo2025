# END-TO-END BUSINESS FLOW AUDIT (E2E_BUSINESS_FLOW_AUDIT.md)

**Проект**: Бадминтон Клуб Гълъбово 2025 (`bkgalabovo2025`)  
**Дата на одита**: 18 септември 2026 г.  
**Роля**: Senior QA Architect, Principal Software Engineer, Business Systems Analyst  
**Обхват**: Пълен End-to-End функционален и архитектурен одит на бизнес процесите (Audit Only — без промяна на сорс код).

---

## 1. Executive Summary

Настоящият одит анализира цялостните бизнес процеси в системата — от потребителското действие в браузъра през клиентските хукове, сървърните екшъни и API ендпойнти, до валидацията, персистирането във Firebase/Firestore/Storage и обратното обновяване на клиентското състояние.

### Основни изводи:
1. **Здрава архитектурна основа**: След проведената фаза на ремедиация критичните пътища за вход (`/login`), публичен тест с AI обратна връзка (`/quiz/[token]`), резервации на кортове и сесии във възстановителната зона, както и навигацията през графиките работят коректно от край до край.
2. **Идентифицирани дефекти в бизнес потоците**:
   - **P1 (High)**: Открити 3 важни несъответствия:
     - Липса на `recoveryzonebyzm@gmail.com` в `ensureAdminFromSession` (води до отказ на админ права за сесийно влезли Recovery Zone администратори при сваляне на бекъпи и диагностика).
     - Пропускане на реалната колекция `training_attendance` в `BACKUP_COLLECTIONS` (бекъпът търси стара колекция `attendance`, пропускайки присъствията от тренировки).
     - Твърдо зададен `siteId: "default"` при директно създаване на продажба през `/sales/new`, което прави продажбата невидима при филтриране по клон в `SalesClient`.
   - **P2 (Medium)**: Открити 4 умерени проблема, свързани с липса на tenant scope проверка в `/api/ai/generate-workout`, разминаване в именуването на колекцията за складови събития (`inventoryEvents` vs `inventory_events`), и липса на бекъп покритие за `clubGeneralServices`, `member_declarations` и `reservations`.
   - **P3 (Low)**: 2 козметични / защитни забележки (fallback стойности за `siteId`).
3. **P0 (Critical)**: **0 открити блокиращи дефекта**. Основните трансакции, платежни операции и резервационният график работят стабилно.

---

## 2. Business Flow Map

| № | Бизнес Домейн | Основни UI Пътища | Backend / Server Actions / API | Данни (Firestore / Storage) |
|---|---|---|---|---|
| **1** | **Authentication & Roles** | `/login`, `/profile`, защитени страници | `loginAction`, `/api/auth/session`, `/api/auth/logout`, `auth-utils.ts` | Firebase Auth, Cookies (`session`) |
| **2** | **Members & Profiles** | `/members`, `/members/new`, `/members/[id]`, `/members/[id]/edit` | `createMemberAction`, `updateMemberAction`, `deleteMemberAction`, `member-service.ts` | `members`, `audit_logs` |
| **3** | **Schedule & Attendance** | `/schedule`, `/schedule-builder` | `updateAttendeesAction`, `schedule-service.ts`, `trainings.ts` | `events`, `trainings`, `training_attendance` |
| **4** | **Reservations & Courts** | `/schedule?tab=reservations`, `/reservations` | `createReservationAction`, `cancelReservationAction`, `reservations.ts` | `reservations`, `blockedSlots`, `sites` |
| **5** | **Recovery Zone** | `/recovery-zone`, `/recovery-zone/catalog`, `/schedule?tab=recovery` | `createReservationAction`, `recovery-services-server.ts`, `inquiries/route.ts` | `sessions`, `reservations`, `inquiries` |
| **6** | **Services & Catalogs** | `/catalogs`, `/club/catalog`, `/finances/general-services` | `club-service.ts`, `general-services-server.ts`, `services.ts` | `clubServices`, `clubGeneralServices`, `serviceHistory` |
| **7** | **Sales & Checkout** | `/sales`, `/sales/new`, `/sales/[id]`, `UnifiedSaleWizardDialog` | `createSaleAction`, `executeGeneralServiceSaleAction`, `sales.ts` | `sales`, `products`, `inventory_events` |
| **8** | **Inventory & Gear** | `/inventory` | `inventoryService.ts` | `inventory` |
| **9** | **Payments & Reminders** | `/payments`, `/dashboard` (Birthday/Overdue) | `dashboard.ts`, `/api/send-reminders`, `reminder-service.server.ts` | `sales`, `members`, `email_logs` |
| **10** | **Declarations & Cards** | `/declarations`, `/members/[id]/athlete-card`, `/members/[id]/declaration` | `DeclarationsClient.tsx`, `useMemberProfile.ts`, PDF генерация | `member_declarations`, `/public/declaration/*` |
| **11** | **Assessments & Tests** | `/training/assessments`, `/training/beep-test` | `skill-evaluation-service.ts` | `member_assessments`, `beep_test_results` |
| **12** | **Quiz & AI Feedback** | `/quiz/[token]`, `/training/theory` | `quiz-player.tsx`, `/api/quiz/ai-feedback`, `/api/quiz/ai-eval` | `theory_results`, Gemini API |
| **13** | **Inquiries & Notifications** | `/inquiries`, `/recovery-zone/catalog`, Dashboard cards | `/api/inquiries`, Nodemailer, `InquiriesNotificationCard.tsx` | `inquiries`, SMTP Transporter |
| **14** | **Backup & Maintenance** | `/api/cron/backup`, `/api/admin/backup/download` | `backup/route.ts`, `backup/download/route.ts` | `system_backups`, Firebase Storage |
| **15** | **Cron Jobs** | `/api/cron/check-statuses`, `/api/cron/reminders` | `check-statuses/route.ts`, `reminders/route.ts` | `members`, `events`, `business_trips` |
| **16** | **Reports & Statistics** | `/reports`, `/accounting` | `report-service.ts`, `reports.ts` | `sales`, `members`, `events` |
| **17** | **File Upload / Storage** | Аватар качване, файлове на състезатели | `/api/upload` | `sites/{siteId}/uploaded_files`, Cloud Storage |

---

## 3. Flow-by-Flow Results (Execution Paths & Scenarios)

### Flow 1: Authentication & Session
* **Execution Path**:
  `LoginPage` (`src/app/login/page.tsx`)  
  ↓  
  `loginAction(email, password)` (`src/lib/actions/auth.ts`)  
  ↓  
  Firebase Auth REST API (`verifyIdToken` → `createSessionCookie`)  
  ↓  
  HTTP Response Cookie (`session`, `httpOnly`, `sameSite: lax`, 5 days) + Client `signInWithEmailAndPassword`  
  ↓  
  Next.js Edge Proxy (`src/proxy.ts` verifies cookie) → Dashboard (`/dashboard`)  
* **Happy Path**: Потребителят въвежда валиден имейл и парола; сървърът валидира токена, записва `session` бисквитка; клиентският SDK се синхронизира; потребителят се пренасочва към `/dashboard`.
* **Failure Paths**:
  - Грешна парола / липсващ потребител: връща приятелско съобщение „Грешен имейл или парола.“, статус `success: false`.
  - Деактивиран потребител: връща „Този профил е деактивиран от администратор.“.
  - Твърде много опити: връща предупреждение за ограничение по време.
  - Изтекла сесия: `src/proxy.ts` редиректва към `/login?redirect=/path`.

---

### Flow 2: Members Lifecycle
* **Execution Path**:
  `NewMemberPage` (`src/app/(protected)/members/new/page.tsx`)  
  ↓  
  `createMemberAction(idToken, data)` (`src/lib/actions/members.ts`)  
  ↓  
  `ensureAdmin(idToken)` → `MemberSchema.safeParse(data)`  
  ↓  
  `adminDb.collection("members").add(...)` + `audit_logs.add(...)`  
  ↓  
  `revalidatePath("/members")` → `router.push('/members/${id}')`  
* **Happy Path**: Данните на състезателя се валидират през Zod; създава се документ в `members`; записва се одит събитие в `audit_logs`; потребителят вижда детайлната карта на състезателя.
* **Failure Paths**:
  - Невалиден имейл / липсващи задължителни полета: Zod връща `errors` по полета, формата показва червени индикатори.
  - Липса на админ права: връща грешка „Нямате администраторски права.“.

---

### Flow 3: Schedule, Events & Attendance
* **Execution Path**:
  `ScheduleClient.tsx` (`src/app/(protected)/schedule/ScheduleClient.tsx`)  
  ↓  
  `updateAttendeesAction(idToken, eventId, attendees, monthLabel, monthKey)` (`src/lib/actions/events.ts`)  
  ↓  
  `getAuthUser(idToken)` → `findMatchingSaleForAttendee(...)`  
  ↓  
  Ако присъстващият няма плащане, но има активен месечен абонамент в `sales`, автоматично се свързва `saleId` и се маркира като платено  
  ↓  
  `adminDb.collection("events").doc(eventId).update({ attendees, attendeeMemberIds })`  
* **Happy Path**: Треньорът маркира присъствие; системата автоматично засича дали детето има платен месечен абонамент и оцветява статуса в зелено; записва присъствието в събитието.
* **Failure Paths**:
  - Несъществуващо събитие: връща „Събитието не е открито.“.
  - Липсващ токен: връща 401/Unauthorized.

---

### Flow 4: Court Booking & Recovery Reservations
* **Execution Path**:
  `ReservationsClient.tsx` / `ReservationModal.tsx`  
  ↓  
  `createReservationAction(idToken, payload)` (`src/lib/actions/reservations.ts`)  
  ↓  
  `getAuthUser(idToken)` → `reservationSchema.safeParse(...)`  
  ↓  
  `checkReservationConflicts` + `checkRecoveryInventory` (проверка на свободни компресори и маншети крака/ръце/таз) + `checkBlockedSlots`  
  ↓  
  `findOrCreateGuestProfile` (ако клиентът не съществува) → `adminDb.collection("reservations").add(...)`  
  ↓  
  Ако статусът е платен: `createSaleForReservation` записва продажба в `sales` и обновява `lastPaymentDate` в `members`  
* **Happy Path**: Проверяват се застъпвания и капацитет на Normatec оборудването; създава се резервация; автоматично се генерира продажба; изпраща се имейл потвърждение.
* **Failure Paths**:
  - Дублиран час на корта: връща „Избраният период се застъпва със съществуваща резервация.“.
  - Недостиг на компресори: връща „Няма достатъчно компресори (търсени X, свободни Y).“.
  - Блокиран слот: връща предупреждение за блокирано време от залата.

---

### Flow 5: Public Inquiry to Recovery Session
* **Execution Path**:
  Публичен формуляр в `/recovery-zone/catalog`  
  ↓  
  `POST /api/inquiries` (`src/app/api/inquiries/route.ts`)  
  ↓  
  `InquiryInputSchema.safeParse(...)` → `adminDb.collection("inquiries").add(...)`  
  ↓  
  Nodemailer изпраща имейл до `ADMIN_NOTIFICATION_EMAIL`  
  ↓  
  Администраторът вижда нотификация в `InquiriesNotificationCard.tsx` / `/inquiries`  
  ↓  
  `PATCH /api/inquiries` обновява статуса на `contacted` / `enrolled`  
* **Happy Path**: Клиент заявява възстановителна сесия през сайта; запитването се записва със статус `new`; администраторът получава имейл и нотификация на живо в таблото; с един клик се свързва с клиента.
* **Failure Paths**:
  - Невалиден телефон или име: връща HTTP 400 с точните полеви грешки.
  - Грешка в SMTP: запитването се записва успешно в базата, а грешката от мейлъра се логва в конзолата без прекъсване на потребителския flow.

---

### Flow 6: Sales & Checkout Wizard
* **Execution Path**:
  `UnifiedSaleWizardDialog.tsx`  
  ↓  
  Стъпка 1: Избор/търсене на член или нов гост  
  Стъпка 2: Конфигурация на услуга / абонамент / продукт  
  Стъпка 3: Избор на месеци или индивидуални дати  
  Стъпка 4: Платежен метод, цена, фактура/бележка  
  ↓  
  `executeTrainingSaleAction` / `executeGeneralServiceSaleAction` / `createSaleAction`  
  ↓  
  Трансакция във Firestore: записва `sales`, намалява складова наличност в `products` (за стоки), записва `inventory_events`  
  ↓  
  Показва екран за успех и директна връзка към квитанция (`/sales/[id]/receipt`)  
* **Happy Path**: Продажбата се финализира с атомна трансакция; членската история се обновява незабавно чрез SWR `mutate`.
* **Failure Paths**:
  - Недостатъчна наличност за физически продукт: трансакцията се отменя и връща „Недостатъчна наличност за X.“.

---

### Flow 7: Public Quiz & AI Evaluation
* **Execution Path**:
  Състезателят отваря `/quiz/[token]`  
  ↓  
  `QuizPlayer` (`src/app/quiz/[token]/quiz-player.tsx`) зарежда опита по `token`  
  ↓  
  Състезателят отговаря на затворени въпроси и тактически казус  
  ↓  
  `quizService.submitTacticalAnswer(...)` запазва автоматичните точки в `theory_results`  
  ↓  
  `POST /api/quiz/ai-feedback` валидира `shareToken`, казуса и отговорите  
  ↓  
  Google Gemini API анализира тактическия отговор и грешките; отговорът се кешира в `theory_results`  
  ↓  
  Състезателят вижда интерактивна оценка, точки и треньорски съвети.
* **Happy Path**: 100% работещ публичен flow без нужда от регистрация; защитен срещу replay и източване на квота.
* **Failure Paths**:
  - Подменен токен: HTTP 403 „Forbidden: Invalid quiz context token“.
  - Повторен опит: връща вече генерирания кеширан feedback без ново извикване към Gemini.

---

### Flow 8: Automated System Backup
* **Execution Path**:
  Cron Job / Admin trigger: `POST /api/cron/backup`  
  ↓  
  `checkAuth(request)`: верифицира `CRON_SECRET`, Bearer токен или `ensureAdminFromSession()`  
  ↓  
  Обикаля масива `BACKUP_COLLECTIONS`  
  ↓  
  Извлича документите от Firestore, сериализира ги и записва метаданни в `system_backups`  
  ↓  
  Администраторът може да свали архива през `GET /api/admin/backup/download`  
* **Happy Path**: Генерира пълен JSON snapshot на посочените колекции.
* **Failure Paths**:
  - Неоторизиран достъп: връща 401 Unauthorized.

---

## 4. Broken Connections

| ID | Компонент / Път | Описание на проблема | Засегнати файлове | Бизнес ефект |
|---|---|---|---|---|
| **BC-01** | `/sales/new` (директен достъп) | При директно зареждане на `/sales/new`, `NewSaleClient.tsx` извиква `createSaleAction` с твърдо кодиран `siteId: "default"`, вместо текущия `activeBranch`. | `src/app/(protected)/sales/new/NewSaleClient.tsx` | Продажбите, създадени през този път, не се показват във филтрите за `bkgalabovo` или `recoveryzone`. |
| **BC-02** | `BACKUP_COLLECTIONS` в Backup Cron | В масива на бекъпа фигурира `"attendance"`, докато реалната колекция в базата е `"training_attendance"`. | `src/app/api/cron/backup/route.ts` | Присъствените списъци от тренировъчния модул не се включват в автоматичния архив. |

---

## 5. Authorization Findings

| ID | Ниво | Endpoint / Функция | Описание на уязвимостта | Доказателство / Ред |
|---|---|---|---|---|
| **AUTH-01** | **P1** | `ensureAdminFromSession()` | Функцията проверява само `user.email !== "bkgalabovo2014@gmail.com"`, пропускайки административния имейл на възстановителния център `recoveryzonebyzm@gmail.com` (който е коректно включен в `ensureAdmin`). | `src/lib/auth-utils.ts:72` |
| **AUTH-02** | **P2** | `POST /api/ai/generate-workout` | Ендпойнтът проверява дали потребителят е влязъл, но не проверява дали поисканият `memberId` принадлежи към разрешения за треньора клон (`siteId`). | `src/app/api/ai/generate-workout/route.ts:2029` |
| **AUTH-03** | **P2** | `GET /api/services/[serviceId]` | Ендпойнтът връща данни за услуга за всеки автентикиран потребител без проверка за принадлежност към конкретния клубен клон. | `src/app/api/services/[serviceId]/route.ts:36` |

---

## 6. Multi-Tenant Findings

1. **Изолация на членове (`members`)**:
   - `src/services/member-service.server.ts` изпълнява `getAllMembersServer()` без `where("siteId", "==", siteId)`. Изолацията разчита на клиентско филтриране в `MembersClient.tsx` чрез табовете `members` и `recovery-clients`.
   - Препоръка: При бъдеща фаза да се добави сървърно филтриране по `siteId` за по-строга защита на данните при SSR.
2. **Изолация на продажби (`sales`)**:
   - Повечето форми и уизардът `UnifiedSaleWizardContext` коректно подават `siteId: activeBranch || "bkgalabovo"`.
   - Изключение: `NewSaleClient.tsx` (вж. BC-01), където се записва `"default"`.
3. **Изолация при възстановяване (`sessions`)**:
   - Всички процедури във възстановителната зона стриктно използват `siteId: "recoveryzone"`.

---

## 7. API Contract Findings

| Endpoint | Метод | Автентикация | Входни данни | Валидация | Поведение при грешка | Консуматори |
|---|---|---|---|---|---|---|
| `/api/auth/session` | POST | Public | `{ idToken: string }` | Firebase Admin `verifyIdToken` | 400 при липсващ токен; 500 при невалиден | `login/page.tsx` |
| `/api/auth/logout` | POST | Public | None | None | 200 (чисти бисквитката) | Навигационни барове, профил |
| `/api/inquiries` | POST | Public | `InquiryInputSchema` | Zod safeParse | 400 с детайли за полета | Публичен каталог и форми |
| `/api/inquiries` | GET | Admin (Cookie/Token) | Query `?siteId=` | Проверка на сесия | 401 Unauthorized | Табло, нотификационна карта |
| `/api/inquiries` | PATCH | Admin (Cookie/Token) | `{ id, status }` | Zod / Проверка на статус | 400 / 401 / 500 | `InquiriesClient.tsx` |
| `/api/quiz/ai-feedback`| POST | Public via `shareToken`| `AiFeedbackRequestSchema`| Zod + `theory_results` съвпадение | 400 / 403 / 500 | `quiz-player.tsx` |
| `/api/upload` | POST | Auth (User) | `FormData` (file, siteId) | Размер, разширение, path traversal | 400 / 401 / 500 | Качване на файлове/аватари |
| `/api/upload` | GET | Auth (Cookie/Token) | `?fileId=&siteId=` | Tenant ownership check | 401 / 403 / 404 | Преглед и сваляне на файлове |
| `/api/cron/backup` | GET/POST | Secret / Admin | Query `?siteId=` | `CRON_SECRET` или Admin | 401 Unauthorized | Cloud Scheduler, Admin UI |
| `/api/cron/check-statuses`| GET | Secret / Admin | None | `CRON_SECRET` или Admin | 401 Unauthorized | Cloud Scheduler |

---

## 8. Database Consistency Findings

1. **`training_attendance` vs `attendance`**:
   - В код: `src/services/planner-service.ts` дефинира `const ATTENDANCE_COLLECTION = "training_attendance";`.
   - В бекъп: `BACKUP_COLLECTIONS` в `backup/route.ts` търси `"attendance"`.
   - Ефект: Колекцията `training_attendance` остава извън бекъпа.
2. **`inventoryEvents` vs `inventory_events`**:
   - В `src/lib/firebase-collections.ts`: `collection(getDb(), "inventoryEvents")`.
   - В `src/lib/actions/sales.ts`: `adminDb.collection("inventory_events")`.
   - Ефект: `firebase-collections.ts` реферира колекция с CamelCase, която не получава записи при продажби.
3. **Липсващи колекции в `BACKUP_COLLECTIONS`**:
   - В момента се архивират 14 колекции. Не са включени: `member_declarations`, `reservations`, `blockedSlots`, `theory_results`, `clubGeneralServices`, `tournaments`, `tournament_entries`, `tournament_matches`, `products`.

---

## 9. Critical Risks Analysis

1. **Риск от пропускане на резервационни данни при Disaster Recovery**:
   - Тъй като колекцията `reservations` съдържа графика за кортовете и възстановителната зона, отсъствието ѝ от `BACKUP_COLLECTIONS` крие риск при пълно възстановяване на базата.
2. **Риск от отказ на права за втория администратор при сесиен достъп**:
   - Поради пропуск в `ensureAdminFromSession`, мениджърът на Recovery Zone може да срещне „Нямате администраторски права“ при опит за сваляне на архиви от админ панела.

---

## 10. Класификация на констатациите (P0 / P1 / P2 / P3)

### P0 — Critical (0 констатации)
*Няма открити дефекти с критично ниво, блокиращи работата на системата.*

---

### P1 — High (3 констатации)

#### FINDING-P1-01
* **ID**: FINDING-P1-01
* **Severity**: **P1 (High)**
* **Business Flow**: Authentication / Admin Authorization
* **Expected Behavior**: И двата администраторски имейла (`bkgalabovo2014@gmail.com` и `recoveryzonebyzm@gmail.com`) трябва да имат пълен административен достъп през сесийни бисквитки.
* **Actual Behavior**: `ensureAdminFromSession` проверява единствено `bkgalabovo2014@gmail.com`, игнорирайки `recoveryzonebyzm@gmail.com`.
* **Root Cause**: Пропуск при синхронизиране на списъка с имейли между `ensureAdmin` и `ensureAdminFromSession`.
* **Evidence**: `src/lib/auth-utils.ts:72`.
* **Affected Files**: `src/lib/auth-utils.ts`
* **Business Impact**: Администраторът на Recovery Zone не може да изпълнява админ бекъпи или специфични админ проверки през сесийна автентикация.
* **Recommended Fix**: Да се добави `&& user.email !== "recoveryzonebyzm@gmail.com"` в условието на ред 72.

#### FINDING-P1-02
* **ID**: FINDING-P1-02
* **Severity**: **P1 (High)**
* **Business Flow**: Backup & Disaster Recovery
* **Expected Behavior**: Архивирането на присъствията от тренировки трябва да обхваща реалната колекция в Firestore.
* **Actual Behavior**: Масивът `BACKUP_COLLECTIONS` съдържа `"attendance"`, докато реалните документи се пишат в `"training_attendance"`.
* **Root Cause**: Историческо разминаване в именуването на колекцията между ранните прототипи и `planner-service.ts`.
* **Evidence**: `src/services/planner-service.ts:26` спрямо `src/app/api/cron/backup/route.ts:14`.
* **Affected Files**: `src/app/api/cron/backup/route.ts`
* **Business Impact**: Присъствията на децата от тренировъчния планьор не се архивират автоматично.
* **Recommended Fix**: В `BACKUP_COLLECTIONS` да се замени `"attendance"` с `"training_attendance"`.

#### FINDING-P1-03
* **ID**: FINDING-P1-03
* **Severity**: **P1 (High)**
* **Business Flow**: Sales & Multi-Tenancy
* **Expected Behavior**: Създадените продажби през директната страница `/sales/new` трябва да се асоциират с активния клон (`activeBranch`).
* **Actual Behavior**: Записва се твърдо `siteId: "default"`.
* **Root Cause**: Пропусната интеграция с `useAppStore.getState().activeBranch` в `NewSaleClient.tsx`.
* **Evidence**: `src/app/(protected)/sales/new/NewSaleClient.tsx:47`.
* **Affected Files**: `src/app/(protected)/sales/new/NewSaleClient.tsx`
* **Business Impact**: Продажбите стават невидими при филтриране по клон в `SalesClient`.
* **Recommended Fix**: Замяна на `"default"` с `activeBranch || "bkgalabovo"`.

---

### P2 — Medium (4 констатации)

#### FINDING-P2-01
* **ID**: FINDING-P2-01
* **Severity**: **P2 (Medium)**
* **Business Flow**: AI Workout Generator / Tenant Privacy
* **Expected Behavior**: Генерирането на тренировъчна програма през `/api/ai/generate-workout` трябва да валидира, че треньорът има права за клона на съответния състезател.
* **Actual Behavior**: Проверява се само дали има валиден потребител, без проверка на `siteId` съответствие.
* **Root Cause**: Липса на tenant scope проверка в `verifyRequestUser`.
* **Evidence**: `src/app/api/ai/generate-workout/route.ts:2029`.
* **Affected Files**: `src/app/api/ai/generate-workout/route.ts`
* **Business Impact**: Възможност за достъп до тренировъчния профил на състезател от друг клон.
* **Recommended Fix**: Проверка дали `memberDoc.data().siteId` съвпада с позволените клонове на потребителя.

#### FINDING-P2-02
* **ID**: FINDING-P2-02
* **Severity**: **P2 (Medium)**
* **Business Flow**: Backup Coverage Completeness
* **Expected Behavior**: Автоматичният бекъп трябва да включва всички оперативни колекции с бизнес стойност.
* **Actual Behavior**: Пропуснати са колекциите `reservations`, `member_declarations`, `theory_results`, `clubGeneralServices`, `tournaments`.
* **Root Cause**: Консервативен списък `BACKUP_COLLECTIONS`.
* **Evidence**: `src/app/api/cron/backup/route.ts:10-24`.
* **Affected Files**: `src/app/api/cron/backup/route.ts`
* **Business Impact**: При възстановяване от архив ще липсват резервациите и подписаните декларации.
* **Recommended Fix**: Добавяне на липсващите колекции в масива.

#### FINDING-P2-03
* **ID**: FINDING-P2-03
* **Severity**: **P2 (Medium)**
* **Business Flow**: Inventory & Sales Event Logging
* **Expected Behavior**: `firebase-collections.ts` и `sales.ts` трябва да използват еднакво име за колекцията със складови събития.
* **Actual Behavior**: Единият модул използва `inventoryEvents`, а другият `inventory_events`.
* **Root Cause**: Casing конвенция (CamelCase vs snake_case).
* **Evidence**: `src/lib/firebase-collections.ts:166` спрямо `src/lib/actions/sales.ts:94`.
* **Affected Files**: `src/lib/firebase-collections.ts`
* **Business Impact**: Несъответствие при евентуални бъдещи клиентски четения през `firebase-collections.ts`.
* **Recommended Fix**: Синхронизиране към каноничното `inventory_events`.

#### FINDING-P2-04
* **ID**: FINDING-P2-04
* **Severity**: **P2 (Medium)**
* **Business Flow**: Member Retrieval Server-Side Scoping
* **Expected Behavior**: `getAllMembersServer()` да поддържа опционален параметър `siteId`.
* **Actual Behavior**: Връща всички членове от колекцията без филтър за наемател.
* **Evidence**: `src/services/member-service.server.ts:13`.
* **Affected Files**: `src/services/member-service.server.ts`
* **Business Impact**: Всички членове се изпращат в първоначалния SSR HTML, дори потребителят да е избрал конкретен клон.
* **Recommended Fix**: Добавяне на параметър `siteId?: string` с филтриране `query.where("siteId", "==", siteId)`.

---

### P3 — Low (2 констатации)

#### FINDING-P3-01
* **ID**: FINDING-P3-01
* **Severity**: **P3 (Low)**
* **Business Flow**: Reports / Unknown Member Fallback
* **Expected Behavior**: Fallback стойността за `siteId` при непознат състезател в отчетите да бъде динамична.
* **Actual Behavior**: Записано е `siteId: "default"`.
* **Evidence**: `src/services/report-service.ts:77`.
* **Affected Files**: `src/services/report-service.ts`
* **Business Impact**: Козметично разминаване при генериране на аномални репорти.

#### FINDING-P3-02
* **ID**: FINDING-P3-02
* **Severity**: **P3 (Low)**
* **Business Flow**: Price History Default SiteId
* **Expected Behavior**: Преобразувателят на цени да използва каноничен `siteId`.
* **Actual Behavior**: Fallback към `"default"` вместо към активния клубен клон.
* **Evidence**: `src/services/price-service.ts:38`.
* **Affected Files**: `src/services/price-service.ts`
* **Business Impact**: Минимален; в практиката цените винаги съдържат валиден `siteId`.

---

## 11. Препоръчителен ред за бъдеща ремедиация (Recommended Remediation Order)

Ако в бъдеще се планира отстраняване на откритите несъответствия, препоръчва се следната последователност по приоритет:

1. **Етап 1 (Спешни административни и бекъп корекции — P1)**:
   - Коригиране на `ensureAdminFromSession` в `src/lib/auth-utils.ts` с добавяне на `recoveryzonebyzm@gmail.com`.
   - Замяна на `"attendance"` с `"training_attendance"` и добавяне на `reservations`, `member_declarations` в `BACKUP_COLLECTIONS` (`src/app/api/cron/backup/route.ts`).
   - Синхронизиране на `siteId` в `src/app/(protected)/sales/new/NewSaleClient.tsx` с `activeBranch`.
2. **Етап 2 (Сигурност и консистентност на данните — P2)**:
   - Въвеждане на tenant проверка в `POST /api/ai/generate-workout`.
   - Уеднаквяване на `inventory_events` в `src/lib/firebase-collections.ts`.
   - Добавяне на `siteId` филтър в `getAllMembersServer`.
3. **Етап 3 (Почистване на fallback стойности — P3)**:
   - Замяна на остатъчните `"default"` стойности в `report-service.ts` и `price-service.ts`.

---

## 12. FINAL VERIFICATION & AUDIT COMPLETION

```text
Audit Type:     END-TO-END BUSINESS FLOW AUDIT (Audit Only)
Source Code:    UNCHANGED (No modifications, refactoring or deletions)
Database:       UNCHANGED
Configuration:  UNCHANGED

Findings Summary:
- P0 (Critical): 0
- P1 (High):     3
- P2 (Medium):   4
- P3 (Low):      2

Total Findings:  9

Artifact Created: E2E_BUSINESS_FLOW_AUDIT.md
Overall Status:   E2E BUSINESS FLOW AUDIT COMPLETE
```
