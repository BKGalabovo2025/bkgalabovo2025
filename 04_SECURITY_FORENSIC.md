# 04_SECURITY_FORENSIC.md
# SECURITY & ATTACK SURFACE FORENSIC REPORT

---

### 1. Attack Surface Matrix

| ID | Attack Surface | Vulnerability / Issue | Evidence (File & Lines) | Real Impact | Severity |
|---|---|---|---|---|---|
| **SEC-01** | `GET /api/debug` | Unauthenticated Admin SDK query exposing customer names and booking dates | `src/app/api/debug/route.ts:14-38` | Data leakage of customer schedules and names | 🔴 **CRITICAL** |
| **SEC-02** | `GET /api/analyze-reservations` | Unauthenticated raw JSON dump of the first 10 reservations | `src/app/api/analyze-reservations/route.ts:5-16` | Data leakage (GDPR violation) | 🔴 **CRITICAL** |
| **SEC-03** | `GET /api/seed` | Unauthenticated batch delete & rewrite of the entire exercise catalog | `src/app/api/seed/route.ts:8-37` | Denial of Service & Custom Data Destruction | 🟡 **MEDIUM** |
| **SEC-04** | `src/proxy.ts` | Missing Next.js Edge Middleware registration (named `proxy.ts` instead of `middleware.ts`) | `src/proxy.ts:1-35` | Protected route HTML can be fetched before client JS kicks in | 🟠 **HIGH** |
| **SEC-05** | `firestore.rules` | Public read access to `quizzes` and `theory_results` | `firestore.rules:74-79` | Necessary for unauthenticated children quiz access, but exposes all quiz structures publicly | 🟢 **INFO** |
| **SEC-06** | `POST /api/send-reminders` | Secret check only enforced in production (`NODE_ENV === "production"`) | `src/app/api/send-reminders/route.ts:12-18` | In staging or dev environments, anyone can trigger mass reminder emails | 🟢 **LOW** |

---

### 2. Client vs Server Authorization Integrity
- **Frontend UI Check**: В `ProtectedLayoutClient.tsx` има проверка `if (!user) router.replace("/login")`. Това предпазва браузърните потребители, но **НЕ Е** защитен периметър за HTTP ботове.
- **Server API Check**: Маршрутите `/api/upload`, `/api/admin/migrate-members` и `/api/members` коректно извикват `getAuthUser(token)` или `ensureAdmin(token)` през Firebase Admin SDK.
- **Firebase Storage**: Достъпът до Cloud Storage минава през `/api/upload` (Server-side bypass на CORS), където се изисква Bearer token.
