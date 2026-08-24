# BROKEN_BRIDGES.md
## Одит на Прекъснати, Несъответстващи или Рискови Връзки (Broken Bridges & Discrepancies)

Този документ съдържа детайлен анализ на всички открити потенциални и потвърдени несъответствия между слоевете, endpoints, services и модели в repository-то.

---

### 1. [LOW] Орфанни API Endpoints (Dead/Orphaned Route Handlers)

#### 1.1 `/api/services/[serviceId]`
- **Severity**: LOW
- **Source File**: `src/app/api/services/[serviceId]/route.ts`
- **Source Symbol**: `GET` handler
- **Destination File**: Никой (няма извиквания от фронтенда)
- **Contract / Interface**: `GET /api/services/{serviceId}` -> `{ id, name, price, ... }`
- **Какво очаква source**: Клиент да заяви услуга по ID чрез HTTP GET.
- **Какво реално предоставя destination**: Всички клиенти в приложението (`AccountingClient`, `CatalogClient`, `SalesClient`) четат колекцията `clubServices` директно през Firestore Client SDK (`getClubServicesCollection()` в `src/lib/firebase-collections.ts` или `club-service.ts`).
- **Доказателство от кода**: Grep търсене за `/api/services` връща 0 резултата в цялата `src/` директория.
- **Потенциален runtime ефект**: Няма фатален ефект; endpoint-ът работи коректно, но е излишен/мъртъв код.
- **Статус**: ПОТВЪРДЕН (Orphaned API).

#### 1.2 `/api/analyze-db`
- **Severity**: LOW
- **Source File**: `src/app/api/analyze-db/route.ts`
- **Source Symbol**: `GET`
- **Destination File**: Никой
- **Доказателство от кода**: Файлът съдържа само коментар: `// Този файл може да бъде изтрит спокойно.` и връща `new Response("OK")`.
- **Потенциален runtime ефект**: Излишен артефакт от предходни тестове.
- **Статус**: ПОТВЪРДЕН.

#### 1.3 `/api/analyze-reservations` & `/api/debug`
- **Severity**: MEDIUM
- **Source File**: `src/app/api/analyze-reservations/route.ts`, `src/app/api/debug/route.ts`
- **Source Symbol**: `GET`
- **Destination File**: Никой
- **Contract / Interface**: Публичен `GET /api/debug` и `/api/analyze-reservations` без проверка за автентикация.
- **Доказателство от кода**: И двата файла използват `getAdminDb()` и връщат реални данни за резервации и клиенти (вкл. имена на клиенти) в JSON/текстов формат, без да изискват `Authorization` заглавка или админ сесия.
- **Потенциален runtime ефект**: Изтичане на клиентски данни (Data Leakage) при сканиране на публичните API маршрути, тъй като `proxy.ts` пропуска всички `/api` пътища (`publicPaths = ["/login", "/api", "/quiz"]`).
- **Статус**: ПОТВЪРДЕН (Security & Orphaned Endpoint).

---

### 2. [MEDIUM] Несъответствие при `proxy.ts` спрямо Next.js Middleware Конвенцията

- **Severity**: MEDIUM
- **Source File**: `src/proxy.ts`
- **Destination File**: Next.js Runtime Edge Middleware
- **Contract / Interface**: Next.js App Router очаква middleware да бъде именуван точно `middleware.ts` или `src/middleware.ts`, за да го зареди автоматично като глобален Request Interceptor.
- **Какво очаква source**: Файлът `src/proxy.ts` дефинира `export function proxy(request: NextRequest)` и `export const config = { matcher: [...] }`.
- **Какво реално се случва**: Тъй като името на файла е `proxy.ts`, а не `middleware.ts`, Next.js runtime НЕ изпълнява автоматично този файл като Edge Middleware при входящи заявки. Защитата на маршрутите в момента се осъществява на клиентско ниво от `ProtectedLayoutClient.tsx` (`useEffect` -> `if (!user) router.replace("/login")`).
- **Доказателство от кода**: В корена и в `src/` няма файл `middleware.ts`.
- **Потенциален runtime ефект**: Ако потребител спре JavaScript в браузъра си или директно поиска HTML, страниците от `(protected)` ще заредят първоначалния HTML скелет, преди клиентският React да пренасочи.
- **Статус**: ПОТВЪРДЕН.

---

### 3. [LOW] Дублирани колекции за сесии в Firestore (`sessions` vs `training_sessions`)

- **Severity**: LOW
- **Source File 1**: `src/services/club-service.ts` (използва `collection(db, "sessions")`)
- **Source File 2**: `src/services/planner-service.ts` (използва `SESSIONS_COLLECTION = "training_sessions"`)
- **Source File 3**: `src/lib/firebase-collections.ts` (използва `collection(getDb(), "sessions")` с филтър `siteId == "recoveryzone"`)
- **Contract / Interface**: Името на Firestore колекцията за спортни/тренировъчни сесии.
- **Какво очаква source**: `plannerService` записва плановете в `training_sessions`, докато старият `club-service.ts` чете от `sessions`.
- **Доказателство от кода**:
  - `planner-service.ts:16`: `const SESSIONS_COLLECTION = "training_sessions";`
  - `club-service.ts:29`: `getDocs(collection(db, "sessions"));`
- **Потенциален runtime ефект**: `club-service.ts` е зачетен като част от Recovery Zone / Legacy модула и не засяга новия Планировчик, но имената на колекциите могат да подведат нов разработчик.
- **Статус**: ПОТВЪРДЕН (Naming Ambiguity).

---

### 4. [LOW] Добавяне на нов член през API спрямо директен клиентски запис

- **Severity**: LOW
- **Source File**: `src/app/api/members/route.ts`
- **Destination File**: `src/services/member-service.ts`
- **Contract / Interface**:
  - `/api/members` очаква `{ firstName, lastName, email, siteId }` и извиква `addMember(memberData)`
  - Фронтенд компонентите (`MemberFormDialog`) обаче извикват `addMember(...)` директно през Client Firestore SDK, вместо да ползват `/api/members`.
- **Потенциален runtime ефект**: `/api/members` е алтернативен сървърен bridge, който не се ползва от основния UI поток.
- **Статус**: ПОТВЪРДЕН.

---

### 5. [LOW] Липсващо поле `messageText` в Zod схемата на `/api/send-email`

- **Severity**: LOW
- **Source File**: `src/app/(protected)/accounting/AccountingClient.tsx`
- **Destination File**: `src/app/api/send-email/route.tsx`
- **Contract / Interface**: `EmailSchema` използва `data: z.record(z.string(), z.any())`.
- **Какво очаква source**: Клиентът изпраща произволен обект `data`, съдържащ `messageText`, `startTime`, `clientName` и др.
- **Какво реално предоставя destination**: Zod схемата валидира с `z.any()`, така че заявката преминава без грешка, но липсва строг Zod discriminated union по шаблон за `data`.
- **Потенциален runtime ефект**: Ако клиент подаде грешно именуван параметър (напр. `text` вместо `messageText`), имейлът ще се изпрати с празен или fallback текст без да хвърли валидационна грешка 400.
- **Статус**: ПОТВЪРДЕН (Weak Contract Validation).
