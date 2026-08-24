# BRIDGE_MAP.md
## Карта на междумодулните и Client-Server мостове (Bridges)

Този документ описва архитектурните връзки (bridges) между компонентите на системата по схемата:
`SOURCE -> Contract/Interface -> Transformation -> DESTINATION`

---

### Bridge 1: User Authentication & Session Establishment
- **SOURCE**: `src/app/login/page.tsx` (`handleLogin`)
- **Contract / Interface**:
  - Arguments: `email: string, password: string`
  - Return: `{ success: boolean; error?: string }`
- **Transformation**: `loginAction(email, password)` в `src/lib/actions/auth.ts` извиква Firebase Identity Toolkit REST API, взема `idToken`, генерира Session Cookie чрез `adminAuth.createSessionCookie` и записва HTTP-only cookie `session` в `next/headers.cookies()`. След това клиентът извиква `signInWithEmailAndPassword(auth, email, password)` за синхронизиране на локалния `AuthContext`.
- **DESTINATION**: `src/lib/actions/auth.ts` -> Firebase Admin SDK -> Next.js Cookies & `src/context/auth-context.tsx`.

---

### Bridge 2: Route Protection Middleware
- **SOURCE**: Next.js Request Pipeline (`src/proxy.ts` / Next.js Middleware)
- **Contract / Interface**:
  - Matcher: All non-static, non-api routes except `/login`, `/quiz/*`, `/api/*`
  - Cookie: `session`
- **Transformation**: Чете `request.cookies.get("session")`. Ако липсва -> `NextResponse.redirect("/login")`. В клиентския `ProtectedLayoutClient.tsx` има дублираща проверка чрез `useAuth()`.
- **DESTINATION**: `src/app/(protected)/*` vs `src/app/login`.

---

### Bridge 3: Email Dispatcher API (Internal & External Calls)
- **SOURCE**:
  - `src/components/reservations/agenda-reservation-item.tsx`
  - `src/components/reservations/reservation-dialog/hooks/useReservationSubmit.ts`
  - `src/components/business-trips/BusinessTripManagerDialog.tsx`
  - `src/app/(protected)/accounting/AccountingClient.tsx`
  - `src/app/(protected)/marketing/MarketingClient.tsx`
  - `src/app/api/send-reminders/route.ts`
  - `src/app/api/cron/reminders/route.ts`
- **Contract / Interface**:
  - Method: `POST /api/send-email`
  - Headers: `Authorization: Bearer <idToken | CRON_SECRET>`
  - Body:
    ```ts
    {
      to: string; // valid email
      subject: string;
      template: "reminder" | "reservationConfirmation" | "deactivated" | "marketing";
      data: Record<string, any>;
      attachments?: { filename: string; content: string; encoding?: string }[];
    }
    ```
- **Transformation**:
  - Валидация със Zod (`EmailSchema`).
  - Проверка на Bearer token (или `CRON_SECRET` или Firebase Admin `ensureAdmin`).
  - Рендериране на React-Email шаблони (`ReminderEmail`, `ReservationConfirmationEmail`, `DeactivatedEmail`, `MarketingEmail`) към HTML и Text.
  - Изпращане през `nodemailer` SMTP транспорт.
- **DESTINATION**: `src/app/api/send-email/route.tsx` -> SMTP Server (`process.env.SMTP_HOST`).

---

### Bridge 4: Server-Side File Storage Bridge (Upload / Delete)
- **SOURCE**: `src/services/storage-service.ts` (`uploadFile`, `deleteFile`)
- **Contract / Interface**:
  - `POST /api/upload`: FormData with `file: File, path: string`, Header: `Authorization: Bearer <token>`
  - `DELETE /api/upload?path=<path>`: Header: `Authorization: Bearer <token>`
- **Transformation**:
  - `getAuthUser(token)` валидира токена през Firebase Admin.
  - Записва буфера директно в Google Cloud Storage кофата (`process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`).
  - Връща публичен URL с формат: `https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[ENCODED_PATH]?alt=media`.
- **DESTINATION**: `src/app/api/upload/route.ts` -> Firebase Admin Storage Bucket.

---

### Bridge 5: Theory & Quiz Public Player Bridge
- **SOURCE**: `src/app/(protected)/training/theory/theory-client.tsx`
- **Contract / Interface**:
  - Link generation: `quizService.submitResult(...)` -> създава `TheoryResult` документ с `shareToken: UUID` и статус `"SENT"`.
  - Публичен URL: `/quiz/[token]`
- **Transformation**:
  - Детето отваря `/quiz/[token]` без автентикация (включено в `publicPaths` в `proxy.ts`).
  - `QuizPlayer` (`src/app/quiz/[token]/quiz-player.tsx`) зарежда въпросите от базата чрез `quizService.getResultByToken(token)`.
  - При предаване на отговорите извиква `quizService.submitTacticalAnswer(resultId, autoScore, tacticalAnswer, answers)` -> статусът става `"PENDING"`.
  - Треньорът вижда отговорите в таб "За Проверка", поставя оценка за тактическата мисия и рецензия -> `quizService.reviewResult(...)` -> статусът става `"REVIEWED"`.
- **DESTINATION**: Firestore `theory_results` collection -> `QuizPlayer` -> `TheoryClient`.

---

### Bridge 6: Camp Itinerary & Daily Session Grouping Bridge
- **SOURCE**: `src/app/(protected)/training/camps/[id]/CampItineraryClient.tsx`
- **Contract / Interface**:
  - Data: `CampSession[]` containing optional `groups?: { id: string; name: string; memberIds: string[] }[]`.
- **Transformation**:
  - При запазване на бърза сесия, обектът се пречиства от `undefined` полета чрез conditional spread.
  - `updateCampSessions(campId, sessions)` в `src/services/schedule-service.ts` сериализира данните и извиква `updateDoc(eventRef, { campSessions })`.
- **DESTINATION**: Firestore `events/{campId}` document.

---

### Bridge 7: Automated Cron Status Check Bridge
- **SOURCE**: Vercel Cron (`vercel.json`) / Manual Trigger
- **Contract / Interface**:
  - `GET /api/cron/check-statuses`
  - Header: `Authorization: Bearer <CRON_SECRET>`
- **Transformation**:
  - Зарежда всички членове от `members` колекцията.
  - Намира последната дата на активност (последна продажба от `sales` или присъствие на събитие от `events`).
  - Ако няма активност над 30 дни: променя статуса на `inactive` и добавя автоматична бележка с часова зона `Europe/Sofia`.
  - Ако неактивен член има нова активност: променя статуса обратно на `active`.
  - Изпълнява пакетирани транзакции (`adminDb.batch()`, до 450 операции на партида).
- **DESTINATION**: Firestore `members` collection.

---

### Bridge 8: Overdue Payment Reminders Cron Bridge
- **SOURCE**: Vercel Cron / `src/app/api/send-reminders/route.ts`
- **Contract / Interface**:
  - `GET /api/cron/reminders` or `POST /api/send-reminders`
  - Header: `Authorization: Bearer <CRON_SECRET>`
- **Transformation**:
  - `getOverdueMembers()` в `src/services/reminder-service.server.ts` филтрира активни членове без валиден абонамент за текущия месец.
  - За всеки член изпраща вътрешна HTTP заявка към `/api/send-email` с шаблон `reminder`.
- **DESTINATION**: `src/app/api/send-email/route.tsx`.
