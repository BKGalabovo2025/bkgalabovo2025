# 03_BROKEN_BRIDGES_FORENSIC.md
# BROKEN BRIDGES FORENSIC MATRIX

Този документ съдържа табличен опис на реалните прекъсвания и несъответствия между компонентите:

| ID | Source | Contract / Interface | Transformation | Destination | Failure / Discrepancy | Severity |
|---|---|---|---|---|---|---|
| **BB-01** | Next.js Server Engine | Next.js Edge Middleware Contract (`middleware.ts`) | Очаква файлът да се казва `middleware.ts` | `src/proxy.ts` | Файлът се казва `proxy.ts`, поради което Next.js не го изпълнява на сървърно ниво | 🟠 **HIGH** |
| **BB-02** | External HTTP Caller | `/api/seed` (Data Reset) | Липсва auth validation | `plannerService` / Firestore | Всеки анонимен клиент може да нулира базата данни с упражнения | 🟡 **MEDIUM** |
| **BB-03** | `useReservationSubmit.ts` | `POST /api/send-email` | Fire-and-forget `fetch` без await | `send-email/route.tsx` | Silent failure — грешките при изпращане на имейл се поглъщат без индикация в UI | 🟡 **MEDIUM** |
| **BB-04** | Client SDK Query | `firestore.rules` (`hasAccessToSite`) | Проверка на Custom Claim `allowedSites` | Firestore Security Rules | Потребители без сетнат `allowedSites` в токена биват отхвърлени за четене | 🟠 **HIGH** |
| **BB-05** | `AccountingClient.tsx` / UI | `EmailSchema` в `/api/send-email` | Очаква строга валидация на параметрите | Nodemailer SMTP Pipeline | `data: z.record(z.string(), z.any())` позволява изпращане на празни имейли при typo в имената на променливите | 🟡 **MEDIUM** |
| **BB-06** | UI Components | `GET /api/services/[serviceId]` | REST API endpoint | `clubServices` Collection | UI компонентите четат директно през Firestore Client SDK, правейки endpoint-а 100% неизползван | 🟢 **LOW** |
| **BB-07** | External HTTP Caller | `/api/debug` & `/api/analyze-reservations` | Липсва auth validation | Firebase Admin SDK (`reservations`) | Публично достъпен пълен дъм на клиентски резервации без автентикация | 🔴 **CRITICAL** |
