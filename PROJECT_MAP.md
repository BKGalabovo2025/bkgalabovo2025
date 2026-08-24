# PROJECT_MAP.md
## Архитектурна карта на Проекта "BKGalabovo2025"

### 1. Общ Преглед и Stack
- **Framework**: Next.js 16.3.2 (App Router, Turbopack, React 19.2.6)
- **Database & Storage**: Google Firebase / Firestore (Client SDK v12.13.0 + Server Admin SDK v13.9.0)
- **Authentication**: Firebase Authentication (Client Auth State + Server Session Cookies / ID Token Verification)
- **Multi-tenant / Branch System**:
  - `bkgalabovo` (Бадминтон Клуб Гълъбово)
  - `recoveryzone` (Recovery Zone by ZM)
- **State Management**: Zustand (`useAppStore` in `src/store/use-app-store.ts`) + React Context (`AuthContext` in `src/context/auth-context.tsx`)
- **Styling**: Tailwind CSS v3.4 + Radix UI + Framer Motion + Lucide React + Sonner / React-Hot-Toast

---

### 2. Структура на Repository-то
```
bkgalabovo2025/
├── .agents/                    # Custom AI workflows & skills
├── public/                     # Static assets (images, icons, manifest.json)
├── scripts/                    # Migration, import, seed scripts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (protected)/        # Authenticated routes with ProtectedLayoutClient
│   │   │   ├── accounting/     # Месечни отчети и приемо-предавателни протоколи
│   │   │   ├── catalogs/       # Каталози на услуги и стоки
│   │   │   ├── dashboard/      # Главно табло с анализи и бързи метрики
│   │   │   ├── declarations/   # Управление на декларации за членство
│   │   │   ├── families/       # Управление на семейни профили
│   │   │   ├── finances/       # Финансови отчети и дневник на плащания
│   │   │   ├── inventory/      # Инвентар и складови наличности
│   │   │   ├── marketing/      # Email/SMS маркетинг и съобщения
│   │   │   ├── members/        # Досиета на членове и картотекиране
│   │   │   ├── print-declaration/ # Печат на декларации за съгласие
│   │   │   ├── rankings/       # Клубни ранглисти и точкова система
│   │   │   ├── recovery/       # Възстановителни процедури (Recovery Zone)
│   │   │   ├── reports/        # Аналитични справки
│   │   │   ├── reservations/   # График на кортове и процедури
│   │   │   ├── sales/          # Продажби и абонаментни плащания
│   │   │   ├── schedule/       # Календар на събития, тренировки и лагери
│   │   │   ├── seed/           # Инструменти за начално зареждане на базата
│   │   │   ├── settings/       # Настройки на клуба и ценоразпис
│   │   │   ├── tournaments/    # Турнирен мениджър и схеми на елиминации
│   │   │   └── training/       # Тренировъчен модул (Планировчик, Лагери, Упражнения, Тестове/Теория)
│   │   ├── api/                # Next.js Server Route Handlers (REST endpoints)
│   │   │   ├── admin/          # Административни миграции
│   │   │   ├── analyze-db/     # Диагностични инструменти
│   │   │   ├── analyze-reservations/
│   │   │   ├── auth/           # /api/auth/session, /api/auth/logout
│   │   │   ├── cron/           # /api/cron/check-statuses, /api/cron/reminders
│   │   │   ├── debug/          # Debug endpoints
│   │   │   ├── members/        # Сървърен endpoint за добавяне на членове
│   │   │   ├── seed/           # Seed API
│   │   │   ├── send-email/     # Централен Email Dispatcher (Nodemailer + React-Email)
│   │   │   ├── send-reminders/ # Endpoint за напомняния за просрочени задължения
│   │   │   ├── services/       # [serviceId] route
│   │   │   └── upload/         # Server-side Firebase Storage upload & delete
│   │   ├── club/               # Публична клубна страница / информация
│   │   ├── login/              # Страница за вход
│   │   ├── quiz/               # Публичен интерактивен плеър за тестове (без вход)
│   │   └── recovery-zone/      # Публичен портал за Recovery Zone
│   ├── components/             # Reusable UI components (Radix + Tailwind)
│   ├── context/                # React Contexts (AuthContext)
│   ├── hooks/                  # Custom React Hooks
│   ├── lib/                    # Core libraries, Firebase config, utils
│   ├── mappers/                # Data transformation mappers
│   ├── repositories/           # DB Abstraction layer
│   ├── services/               # Domain Business Logic Services
│   ├── store/                  # Zustand global store (`useAppStore`)
│   └── types/                  # TypeScript Types, Interfaces, Zod Schemas
```

---

### 3. Основни Системни Модули

| Модул | Описание | Основни компоненти | Services |
|---|---|---|---|
| **Автентикация & Сесии** | Dual-layer auth (Client Firebase Auth + Server HTTP-only cookies) | `AuthContext`, `loginAction`, `proxy.ts`, `ProtectedLayoutClient` | `auth-utils.ts`, `firebase-admin.ts` |
| **Управление на Членове** | Досиета, детайли, статуси (Active/Inactive), картотека | `MemberTable`, `MemberFormDialog`, `MemberDetailModal` | `member-service.ts`, `member-service.server.ts` |
| **Резервации & Кортове** | Календари за бадминтон кортове и Recovery Zone кабинети | `ReservationsCalendar`, `AgendaReservationItem` | `reservations.ts`, `schedule-service.ts` |
| **Финанси & Продажби** | Касови операции, членски вноски, абонаменти, пакети | `SalesClient`, `AccountingClient` | `sales-service.ts`, `price-service.ts` |
| **Тренировъчен Планировчик** | Дневен планировчик, фази на тренировка, блокове, упражнения | `PlannerClient`, `CreateSessionWizard`, `DailyTimeline` | `planner-service.ts` |
| **Лагери & Програма** | Многодневни спортни лагери, участници, график по дни, групи | `CampDetailsClient`, `CampItineraryClient` | `schedule-service.ts`, `planner-service.ts` |
| **Теория & Викторини** | Банка с въпроси, конструктор на тестове, изпращане по Viber, проверка | `TheoryClient`, `QuizPlayer`, `QuizPlayerResult` | `quiz-service.ts`, `question-bank.ts` |
| **Турнирен Мениджър** | Схеми (директни елиминации), мачове, точкуване, картотекиране | `TournamentClient`, `MatchDialog` | `tournament-service.ts`, `match-generator.ts` |
| **Командировки & Разходи**| Създаване на заповеди, пътни разходи, аванси и отчети | `BusinessTripsClient`, `BusinessTripManagerDialog`| `business-trip-service.ts` |
| **Email & Известия** | Изпращане на системни имейли, маркетинг съобщения, напомняния | `send-email/route.tsx`, `cron/reminders/route.ts` | `nodemailer`, `react-email` |
