# 06_API_CONTRACT_FORENSIC.md
# API CONTRACTS & CLIENT-SERVER BRIDGES FORENSIC REPORT

---

### 1. Детайлна Справка по API Endpoints

#### 1. `/api/auth/session`
- **Method**: `POST`
- **Input**: `{ idToken: string }`
- **Output**: `{ status: "success" }` + Cookie `session`
- **Contract Integrity**: ✅ CONFIRMED (Коректен контракт, верифицира токена през Admin SDK).

#### 2. `/api/auth/logout`
- **Method**: `POST`
- **Input**: None
- **Output**: `{ status: "success" }` + Cookie `session` with `maxAge: 0`
- **Contract Integrity**: ✅ CONFIRMED.

#### 3. `/api/send-email`
- **Method**: `POST`
- **Input**:
  - `to: string`
  - `subject: string`
  - `template: "reminder" | "reservationConfirmation" | "deactivated" | "marketing"`
  - `data: Record<string, any>`
  - `attachments?: [...]`
- **Contract Weakness**: 🟡 Полето `data` е `z.any()`. Ако клиент подаде грешно име на параметър, имейлът се изпраща празен без валидационна грешка (напр. `AccountingClient.tsx` изпраща `messageText`, а шаблонът `reservationConfirmation` очаква `startTime`).

#### 4. `/api/upload`
- **Method**: `POST` (FormData `file`, `path`) & `DELETE` (Query param `path`)
- **Headers**: `Authorization: Bearer <token>`
- **Output**: `{ success: true, downloadUrl: string }`
- **Contract Integrity**: ✅ CONFIRMED.

#### 5. `/api/cron/check-statuses`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <CRON_SECRET>`
- **Contract Integrity**: ✅ CONFIRMED (Batch update с лимит 450 операции).

#### 6. `/api/cron/reminders`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <CRON_SECRET>`
- **Contract Integrity**: ✅ CONFIRMED.
