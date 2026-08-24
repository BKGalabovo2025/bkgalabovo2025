# 07_DATABASE_FORENSIC.md
# DATABASE MODELS & FIRESTORE SCHEMAS FORENSIC REPORT

---

### 1. Firestore Converters vs Direct JSON Writes

| Колекция | Тип / Схема | Използва Converter | Sanitization (`undefined`) | Оценка на Риска |
|---|---|---|---|---|
| `members` | `MemberSchema` (`src/types/member.types.ts`) | ДА (`memberConverter`) | ДА | 🟢 Ниска |
| `sales` | `SaleSchema` (`src/types/sale.types.ts`) | ДА (`saleConverter`) | ДА | 🟢 Ниска |
| `events` | `ScheduleEvent` (`src/types/index.ts`) | ДА (`eventConverter`) | ДА (JSON.stringify + conditional spread) | 🟢 Ниска |
| `exercises` | `Exercise` (`src/types/planner.types.ts`) | НЕ (Direct JSON) | Частично | 🟡 Средна |
| `planner_sessions` | `PlannerSession` | НЕ (Direct JSON) | Частично | 🟡 Средна |
| `quizzes` | `Quiz` (`src/types/quiz.types.ts`) | НЕ (Direct JSON) | ДА | 🟢 Ниска |
| `theory_results` | `TheoryResult` (`src/types/quiz.types.ts`)| НЕ (Direct JSON) | ДА | 🟢 Ниска |
| `business_trips` | `BusinessTripSchema` (Zod validation) | НЕ (Direct JSON) | ДА (Zod parse) | 🟢 Ниска |
| `trip_expenses` | `TripExpenseSchema` (Zod validation) | НЕ (Direct JSON) | ДА (Zod parse) | 🟢 Ниска |
| `reservations` | `Reservation` (`src/types/reservation.ts`) | ДА (`reservationConverter`) | ДА | 🟢 Ниска |

---

### 2. Забележки по структурите на данните:
- **`undefined` стойности**: Firestore отказва да записва полета с `undefined`. Всички модули, където има опционални полета (напр. `CampSession.groups`, `Attendee.paymentDate`), трябва да използват `conditional spread` `...(prop ? { prop } : {})` или преобразуване през JSON.
- **Дати**: В повечето нови колекции се използва ISO 8601 string (`new Date().toISOString()`), докато в `reservations` и `members` се използват Firestore `Timestamp` обекти, конвертирани през `memberConverter` и `reservationConverter`.
