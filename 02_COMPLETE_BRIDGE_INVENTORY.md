# 02_COMPLETE_BRIDGE_INVENTORY.md
# COMPLETE SYSTEM BRIDGE INVENTORY

| ID | SOURCE | CONTRACT / INTERFACE | TRANSFORMATION | DESTINATION | STATUS | EVIDENCE |
|---|---|---|---|---|---|---|
| **BR-01** | `login/page.tsx` | `{ email, password }` | `loginAction` -> IdentityToolkit -> Admin Cookie -> `signInWithEmailAndPassword` | Firebase Auth + Next.js Cookies | **WORKING** | `src/app/login/page.tsx:28-45`, `src/lib/actions/auth.ts:8-86` |
| **BR-02** | Next.js Server Request | `matcher: ["/((?!api...).*)"]` | Edge interceptor checking `session` cookie | `src/proxy.ts` | **BROKEN** (File named `proxy.ts`, not `middleware.ts`) | `src/proxy.ts:1-35` |
| **BR-03** | `agenda-reservation-item.tsx` | `POST /api/send-email` | Zod validation -> React-Email render -> Nodemailer | SMTP Mail Server | **WORKING** | `src/components/reservations/agenda-reservation-item.tsx:226-245` |
| **BR-04** | `useReservationSubmit.ts` | `POST /api/send-email` | Fire-and-forget fetch without await | SMTP Mail Server | **PARTIALLY BROKEN** (Silent fail on SMTP rejection) | `src/components/reservations/reservation-dialog/hooks/useReservationSubmit.ts:186-230` |
| **BR-05** | `AccountingClient.tsx` | `POST /api/send-email` (PDF) | HTML element -> html2canvas -> PDF Base64 -> Attachment | SMTP Mail Server | **WORKING** | `src/app/(protected)/accounting/AccountingClient.tsx:560-590` |
| **BR-06** | `BusinessTripManagerDialog.tsx`| `POST /api/send-email` | Custom notification message | SMTP Mail Server | **WORKING** | `src/components/business-trips/BusinessTripManagerDialog.tsx:288-310` |
| **BR-07** | `storage-service.ts` | `POST /api/upload` (FormData) | `getAuthUser` verify -> Admin Storage Bucket | Cloud Storage | **WORKING** | `src/services/storage-service.ts:6-33`, `src/app/api/upload/route.ts:6-75` |
| **BR-08** | `storage-service.ts` | `DELETE /api/upload?path=` | `getAuthUser` verify -> File deletion | Cloud Storage | **WORKING** | `src/services/storage-service.ts:40-58`, `src/app/api/upload/route.ts:78-126` |
| **BR-09** | `theory-client.tsx` | `submitResult` -> `shareToken` | Creates `TheoryResult` document with `SENT` | `theory_results` Collection | **WORKING** | `src/services/quiz-service.ts:118-138` |
| **BR-10** | `quiz/[token]/quiz-player.tsx`| `submitTacticalAnswer` | Auto score + tactical answer -> `PENDING` | `theory_results` Collection | **WORKING** | `src/services/quiz-service.ts:140-155` |
| **BR-11** | `theory-client.tsx` (Review) | `reviewResult` | Manual score + feedback -> `REVIEWED` | `theory_results` Collection | **WORKING** | `src/services/quiz-service.ts:180-192` |
| **BR-12** | `CampItineraryClient.tsx` | `updateCampSessions` | Conditional spread to omit `undefined` -> JSON sanitize | `events/{campId}` Document | **WORKING** | `src/services/schedule-service.ts:80-92` |
| **BR-13** | Vercel Cron (`0 0 * * *`) | `GET /api/cron/check-statuses`| Bearer `CRON_SECRET` -> 30+ day inactivity check -> Batch | `members` Collection | **WORKING** | `src/app/api/cron/check-statuses/route.ts:138-177` |
| **BR-14** | Vercel Cron (`0 9 * * 1`) | `GET /api/cron/reminders` | Bearer `CRON_SECRET` -> Trip end check -> Internal email call | `business_trips` -> `/api/send-email` | **WORKING** | `src/app/api/cron/reminders/route.ts:6-85` |
| **BR-15** | External HTTP / UI | `GET /api/services/[serviceId]`| Direct Firestore get | `clubServices` Collection | **ORPHANED** (No caller in entire codebase) | `src/app/api/services/[serviceId]/route.ts:1-46` |
| **BR-16** | External HTTP | `GET /api/debug` | Admin SDK dump of reservations | `reservations` Collection | **DANGEROUS** (Unauthenticated personal data leak) | `src/app/api/debug/route.ts:14-38` |
| **BR-17** | External HTTP | `GET /api/analyze-reservations`| Admin SDK raw text dump | `reservations` Collection | **DANGEROUS** (Unauthenticated personal data leak) | `src/app/api/analyze-reservations/route.ts:5-16` |
| **BR-18** | External HTTP | `GET /api/seed` | Batch delete and rewrite of exercises | `exercises` Collection | **DANGEROUS** (Unauthenticated destructive write) | `src/app/api/seed/route.ts:8-48` |
