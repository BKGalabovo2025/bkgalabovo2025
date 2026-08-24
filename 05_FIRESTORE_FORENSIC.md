# 05_FIRESTORE_FORENSIC.md
# FIRESTORE SECURITY RULES & COLLECTION OPERATIONS FORENSIC REPORT

---

### 1. Firestore Security Rules Matrix (`firestore.rules`)

| Колекция / Път | Read Правило | Create/Update Правило | Delete Правило | Multi-tenancy Проверка | Оценка |
|---|---|---|---|---|---|
| `members`, `events`, `exercises`, `planner_sessions`, `training_attendance`, `prices`, `priceHistory`, `business_trips`, `trip_expenses`, `annual_plans`, `training_templates`, `focus_tags`, `member_declarations`, `marketing_history`, `beep_test_results`, `member_assessments` | `auth != null && checkResourceSiteAccess()` | `isAdmin() && hasValidSiteId() && hasAccessToSite(siteId)` | `isAdmin() && checkResourceSiteAccess()` | Зависи от claim `allowedSites` | 🟠 Проблем за non-admin без claims |
| `sales`, `products`, `inventoryEvents`, `inventory`, `finances`, `client_packages`, `clients`, `reviews`, `config` | `isAdmin() && checkResourceSiteAccess()` | `isAdmin() && hasValidSiteId() && hasAccessToSite(siteId)` | `isAdmin() && checkResourceSiteAccess()` | Защитени само за админ | ✅ Сигурно |
| `settings`, `families` | `isAdmin()` | `isAdmin()` | `isAdmin()` | Глобални | ✅ Сигурно |
| `sessions`, `tournaments`, `quizzes`, `theory_results` | `true` (Публично) | `isAdmin() && hasValidSiteId() && hasAccessToSite(siteId)` | `isAdmin() && checkResourceSiteAccess()` | Публично четене | ✅ Изисква се за публични линкове |
| `theory_results` (специфично) | `true` | `allow update: if true;` (за предаване на тестове) | `isAdmin()` | Отделен update rule | ✅ Работи |
| `sites` | `true` (Публично) | `isAdmin()` | `isAdmin()` | Глобално | ✅ Сигурно |
| `tournament_entries`, `tournament_matches` | `auth != null` | `isAdmin()` | `isAdmin()` | Клубни турнири | ✅ Сигурно |
| `{path=**}/reservations/{docId}` | `auth != null && checkResourceSiteAccess()` | `isAdmin() && hasValidSiteId() && hasAccessToSite(siteId)` | `isAdmin()` | Wildcard path | ✅ Сигурно |
| `{path=**}/blockedSlots/{docId}` | `auth != null && checkResourceSiteAccess()` | `isAdmin() && hasValidSiteId() && hasAccessToSite(siteId)` | `isAdmin()` | Wildcard path | ✅ Сигурно |
| Всичко останало (`{document=**}`) | `false` | `false` | `false` | Fallback Deny All | ✅ Сигурно |

---

### 2. Client vs Server-Side Admin Write Analysis
- **Client-Side Writes**: Спазват стриктно `firestore.rules`. Всички записи от UI се извършват от логнатия админски акаунт (`bkgalabovo2014@gmail.com`).
- **Server-Side Admin SDK Writes**:
  - `src/lib/firebase-admin.ts` инициализира Admin SDK.
  - Admin SDK **напълно заобикаля** `firestore.rules`.
  - Затова API endpoints, които ползват Admin SDK (`/api/upload`, `/api/admin/migrate-members`, `/api/members`), задължително изискват собствена валидация (`ensureAdmin` / `getAuthUser`).
  - **Пробив**: `/api/debug`, `/api/analyze-reservations` и `/api/seed` не проверяват права, въпреки че ползват Admin SDK.
