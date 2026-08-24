# 14_DATA_CONTRACT_FORENSIC.md
# DATA CONTRACTS, MAPPERS & TYPE INTEGRITY FORENSIC REPORT

---

### 1. Zod Validation & TypeScript Contract Matching

| Entity / Domain | TypeScript Interface | Zod Schema | Runtime Mapper | Contract Integrity |
|---|---|---|---|---|
| **Member** | `Member` (`src/types/member.types.ts`) | `MemberSchema` | `memberConverter` | ✅ 100% Match |
| **Sale** | `Sale` (`src/types/sale.types.ts`) | `SaleSchema` | `saleConverter` | ✅ 100% Match |
| **Tournament** | `Tournament` (`src/types/tournament.types.ts`) | `TournamentSchema` | `mapDocToTournament` | ✅ 100% Match |
| **BusinessTrip** | `BusinessTrip` (`src/types/business-trip.types.ts`) | `BusinessTripSchema` | Zod parse before write | ✅ 100% Match |
| **Quiz & Question** | `Quiz`, `QuizQuestion` (`src/types/quiz.types.ts`) | `QuizSchema`, `QuizQuestionSchema` | Direct JSON | ✅ 100% Match |
| **Email Payload** | `EmailTemplateData` | `EmailSchema` (in `send-email/route.tsx`) | `renderEmailTemplate` | 🟡 `data` is `z.any()` (Weak typing) |

---

### 2. Forensic Заключение за Контрактите:
- Всички основни типове в `src/types/` са строго типизирани и разполагат с паралелни Zod валидатори.
- Единственият слабо валидиран интерфейс е тялото `data` в `POST /api/send-email`, което трябва да се замени с discriminated union за избягване на typos в параметрите.
