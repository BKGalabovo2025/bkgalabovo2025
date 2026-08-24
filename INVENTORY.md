# INVENTORY.md
## Пълна Инвентаризация на Системата (Complete System Inventory)

Този документ съдържа систематичен опис на всички компоненти, услуги, зависимости, бази данни и конфигурационни променливи на проекта.

---

### 1. Сървърни API Endpoints (Next.js Route Handlers)

| Route Path | HTTP Method | Auth / Protection | Описание |
|---|---|---|---|
| `/api/auth/session` | `POST` | Public (verifies `idToken`) | Създава 5-дневно HTTP-only session cookie след валидация през Firebase Admin. |
| `/api/auth/logout` | `POST` | Public | Изтрива session cookie-то (maxAge: 0). |
| `/api/send-email` | `POST` | `Bearer <CRON_SECRET>` or `ensureAdmin(token)` | Централен имейл диспечер (Nodemailer + React-Email шаблони). |
| `/api/upload` | `POST` | `Bearer <token>` (`getAuthUser`) | Записва файл в Google Cloud Storage кофата през Admin SDK. |
| `/api/upload` | `DELETE` | `Bearer <token>` (`getAuthUser`) | Изтрива файл от Storage кофата по даден `path` query параметър. |
| `/api/cron/check-statuses` | `GET` | `Bearer <CRON_SECRET>` (optional in dev) | Автоматично променя статус на `inactive` при липса на активност над 30 дни. |
| `/api/cron/reminders` | `GET` | `Bearer <CRON_SECRET>` | Проверява за приключили командировки и праща имейл напомняне на треньорите. |
| `/api/send-reminders` | `POST` | `Bearer <CRON_SECRET>` (in prod) | Намира просрочени абонаменти и изпраща подканващи имейли. |
| `/api/members` | `POST` | `Bearer <token>` (`ensureAdmin`) | Сървърен алтернативен endpoint за създаване на нов член. |
| `/api/admin/migrate-members`| `POST` | `Bearer <token>` (Admin only) | Миграционен скрипт за добавяне на `siteId` и `firstName/lastName`. |
| `/api/seed` | `GET` | Public | Зарежда базови упражнения за `bkgalabovo` в Firestore. |
| `/api/services/[serviceId]` | `GET` | Public | Връща детайли за услуга по ID (Orphaned API). |
| `/api/debug` | `GET` | Public (Unprotected) | Връща филтрирани резервации (Debug / Orphaned). |
| `/api/analyze-reservations` | `GET` | Public (Unprotected) | Връща първите 10 резервации в текстов формат (Debug / Orphaned). |
| `/api/analyze-db` | `GET` | Public | Връща "OK" (Stub). |

---

### 2. Frontend Services & Domain Modules (`src/services/*`)

| Service File | Описание на функциите | Използвани Firestore колекции |
|---|---|---|
| `member-service.ts` | CRUD за членове, търсене по име, филтриране по статус | `members` |
| `member-service.server.ts` | Сървърни заявки за членове през Admin SDK | `members` |
| `schedule-service.ts` | Събития, тренировки, лагери (`updateCampSessions`), часови графици | `events` |
| `sales-service.ts` | Регистриране на продажби, плащания, издаване на абонаменти | `sales` |
| `price-service.ts` | Ценоразпис на услуги, абонаментни планове, история на цени | `prices`, `priceHistory` |
| `planner-service.ts` | Упражнения, тренировъчни планове, присъствия, шаблони | `exercises`, `training_sessions`, `training_attendance`, `annual_plans`, `training_templates`, `focus_tags` |
| `quiz-service.ts` | Викторини, генериране на Viber линкове, предаване и проверка на тестове | `quizzes`, `theory_results` |
| `tournament-service.ts` | Турнири, участници, генерация на срещи (мачове) | `tournaments`, `tournament_entries`, `tournament_matches` |
| `tournament-service.server.ts` | Сървърни турнирни справки | `tournaments` |
| `ranking-service.ts` | Изчисляване на клубни ранглисти и точки | `tournament_matches` |
| `ranking-service.server.ts` | Сървърно преизчисляване на ранглисти | `tournaments`, `tournament_entries`, `tournament_matches` |
| `business-trip-service.ts`| Заповеди за командировка, разходи, аванси | `business_trips`, `business_trip_expenses` |
| `storage-service.ts` | Клиентски wrapper към `/api/upload` за качване/триене на файлове | Cloud Storage Bucket |
| `reminder-service.server.ts`| Анализ на просрочени абонаменти | `members`, `sales` |
| `beep-test-service.ts` | Резултати от Beep Test (совалково бягане) | `beep_test_results` |
| `assessment-service.ts` | Оценяване на физически и технически умения | `member_assessments` |
| `skill-evaluation-service.ts`| Обобщен анализ на умения и прогрес | `training_attendance`, `beep_test_results`, `member_assessments` |
| `inventory-service.ts` | Складови наличности, пера, екипировка | `inventory` |
| `marketing-service.ts` | История на маркетингови съобщения | `marketing_messages` |
| `club-service.ts` | Информация за сесии (Legacy / Recovery) | `sessions` |
| `site-service.ts` | Конфигурация на клубовете / клоновете | `sites` |

---

### 3. Firestore Database Collections Inventory

| Collection Name | Модел / Тип | Използван конвертер | Описание |
|---|---|---|---|
| `members` | `Member` (`src/types/member.types.ts`) | `memberConverter` | Профили на членове, картотека, лични данни, статус |
| `sales` | `Sale` (`src/types/sale.types.ts`) | `saleConverter` | Дневник на продажби, абонаменти, такси за лагери |
| `events` | `ScheduleEvent` (`src/types/index.ts`) | `eventConverter` | Събития, тренировки, лагери (вкл. `campSessions`, `groups`) |
| `prices` | `PriceItem` (`src/types/index.ts`) | `priceConverter` | Актуален ценоразпис на услуги и карти |
| `priceHistory` | `PriceHistoryItem` | `priceHistoryConverter` | Хронологичен архив на ценови промени |
| `exercises` | `Exercise` (`src/types/planner.types.ts`) | Direct JSON | База от над 500 упражнения с категории и видеа |
| `training_sessions` | `PlannerSession` (`src/types/planner.types.ts`) | Direct JSON | Детайлни тренировъчни планове (фази, блокове, групи) |
| `training_attendance` | `TrainingAttendance` | Direct JSON | Присъствени форми от проведени тренировки |
| `annual_plans` | `AnnualPlan` | Direct JSON | Годишни и месечни макропланове |
| `training_templates` | `TrainingTemplate` | Direct JSON | Готови шаблони за тренировки |
| `focus_tags` | `FocusTag` | Direct JSON | Тактически фокус тагове |
| `quizzes` | `Quiz` (`src/types/quiz.types.ts`) | Direct JSON | Тестове по теория и правила |
| `theory_results` | `TheoryResult` (`src/types/quiz.types.ts`) | Direct JSON | Резултати от тестове (`SENT`, `PENDING`, `REVIEWED`) |
| `tournaments` | `Tournament` (`src/types/tournament.types.ts`) | `tournamentConverter` | Турнири (схема, дати, регламент) |
| `tournament_entries`| `TournamentEntry` | `entryConverter` | Записани състезатели по категории |
| `tournament_matches`| `TournamentMatch` | `matchConverter` | Мачове, резултати по геймове, схеми |
| `business_trips` | `BusinessTrip` (`src/types/business-trip.types.ts`) | Direct JSON | Заповеди за командировка |
| `business_trip_expenses` | `ExpenseItem` | Direct JSON | Разходни пера и фактури към командировки |
| `reservations` | `Reservation` (`src/types/reservation.ts`) | `reservationConverter` | Часови резервации на кортове и кабинети |
| `blockedSlots` | `BlockedSlot` | `blockedSlotConverter` | Блокирани периоди за турнири и профилактика |
| `member_declarations` | `DeclarationData` (`src/types/declaration.types.ts`) | `signedDeclarationConverter` | Електронно подписани декларации от родители |
| `member_assessments` | `MemberAssessment` (`src/types/assessment.types.ts`) | `memberAssessmentConverter` | Периодични тестове за умения |
| `beep_test_results` | `BeepTestResult` (`src/types/beep-test.types.ts`) | Direct JSON | Кардио тестове |
| `inventory` | `InventoryItem` (`src/types/inventory.types.ts`) | Direct JSON | Складови наличности и инвентар |
| `marketing_messages`| `MarketingMessage` (`src/types/marketing.types.ts`) | Direct JSON | Изпратени маркетингови имейли/известия |
| `sites` | `Site` (`src/types/site.types.ts`) | Direct JSON | Клубни профили (`bkgalabovo`, `recoveryzone`) |

---

### 4. Environment Variables & Configuration

| Variable Name | Тип | Задължителна | Използва се в |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client / Server | ДА | `src/lib/firebase.ts`, `src/lib/actions/auth.ts` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | ДА | `src/lib/firebase.ts` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client / Server | ДА | `src/lib/firebase.ts`, `src/lib/firebase-admin.ts` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client / Server | ДА | `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`, `upload/route.ts` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | ДА | `src/lib/firebase.ts` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | ДА | `src/lib/firebase.ts` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Client | Не | `src/lib/firebase.ts` (Analytics) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server only | Препоръчителна | `src/lib/firebase-admin.ts` (Admin SDK init) |
| `FIREBASE_PRIVATE_KEY` | Server only | Алтернативна | `src/lib/firebase-admin.ts` |
| `FIREBASE_CLIENT_EMAIL` | Server only | Алтернативна | `src/lib/firebase-admin.ts` |
| `CRON_SECRET` | Server only | ДА (за Cron) | `/api/cron/*`, `/api/send-reminders`, `/api/send-email` |
| `SMTP_HOST` | Server only | ДА (за Email) | `/api/send-email/route.tsx` |
| `SMTP_PORT` | Server only | ДА (за Email) | `/api/send-email/route.tsx` |
| `SMTP_USER` | Server only | ДА (за Email) | `/api/send-email/route.tsx` |
| `SMTP_PASS` | Server only | ДА (за Email) | `/api/send-email/route.tsx` |
| `SMTP_FROM` | Server only | ДА (за Email) | `/api/send-email/route.tsx` |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | Dev / Test | Не | `src/lib/firebase.ts`, `src/lib/actions/auth.ts` |
