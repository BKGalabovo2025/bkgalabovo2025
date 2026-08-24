# 06_API_FORENSIC.md
# API & SERVER ROUTE HANDLERS FORENSIC REPORT

---

### 1. Пълен Инвентар на API Маршрутите (`src/app/api/**`)

| Endpoint Path | HTTP Method | Expected Headers | Auth Mechanism | Destination Function | Security / Integrity Status |
|---|---|---|---|---|---|
| `/api/auth/session` | `POST` | `Content-Type: application/json` | Public (verifies `idToken`) | `adminAuth.createSessionCookie` | ✅ SECURE & WORKING |
| `/api/auth/logout` | `POST` | Any | Public | Clears `session` cookie | ✅ SECURE & WORKING |
| `/api/send-email` | `POST` | `Authorization: Bearer <token\|CRON_SECRET>` | `ensureAdmin(token)` or `CRON_SECRET` | `nodemailer.sendMail` | 🟡 WEAK SCHEMA (data is z.any) |
| `/api/upload` | `POST` | `Authorization: Bearer <token>` | `getAuthUser(token)` | `adminStorage.bucket.file.save` | ✅ SECURE & WORKING |
| `/api/upload` | `DELETE` | `Authorization: Bearer <token>` | `getAuthUser(token)` | `adminStorage.bucket.file.delete` | ✅ SECURE & WORKING |
| `/api/cron/check-statuses` | `GET` | `Authorization: Bearer <CRON_SECRET>` | `CRON_SECRET` verification | `processMembersBatch` | ✅ SECURE & WORKING |
| `/api/cron/reminders` | `GET` | `Authorization: Bearer <CRON_SECRET>` | `CRON_SECRET` verification | Trip Reminder Mailer | ✅ SECURE & WORKING |
| `/api/send-reminders` | `POST` | `Authorization: Bearer <CRON_SECRET>` (prod only) | `CRON_SECRET` in prod | Member Overdue Mailer | 🟡 DEV UNPROTECTED |
| `/api/members` | `POST` | `Authorization: Bearer <token>` | `ensureAdmin(token)` | `addMember` (Server) | 🟢 ORPHANED (UI uses Client SDK) |
| `/api/admin/migrate-members`| `POST` | `Authorization: Bearer <token>` | `verifyIdToken` (Admin check) | Migration batch | ✅ SECURE & WORKING |
| `/api/seed` | `GET` | None | ❌ NONE (Public) | Batch Delete & Write `exercises` | 🟡 DANGEROUS |
| `/api/services/[serviceId]` | `GET` | None | Public | `adminDb.collection("clubServices").doc()` | 🟢 ORPHANED |
| `/api/debug` | `GET` | None | ❌ NONE (Public) | `adminDb.collection("reservations").get()` | 🔴 CRITICAL LEAK |
| `/api/analyze-reservations` | `GET` | None | ❌ NONE (Public) | `adminDb.collection("reservations").limit(10)`| 🔴 CRITICAL LEAK |
| `/api/analyze-db` | `GET` | None | None | Returns "OK" | 🟢 DEAD STUB |
