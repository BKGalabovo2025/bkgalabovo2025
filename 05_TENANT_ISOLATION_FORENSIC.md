# 05_TENANT_ISOLATION_FORENSIC.md
# MULTI-TENANT & SITE ISOLATION FORENSIC REPORT

Системата обслужва два основни клона (тенънта):
1. `bkgalabovo` (Бадминтон Клуб Гълъбово)
2. `recoveryzone` (Recovery Zone by ZM)

---

### 1. Tenant Isolation Analysis Table

| ID | Module / Service | Collection | Isolation Mechanism | Verification Status | Potential Risk / Severity |
|---|---|---|---|---|---|
| **TI-01** | Members (`member-service.ts`) | `members` | `where("siteId", "==", siteId)` | ✅ CONFIRMED | Безопасно. Всички заявки филтрират по `activeBranch`. |
| **TI-02** | Schedule & Events (`schedule-service.ts`) | `events` | `createSiteQuery(getEventsCollection())` | ✅ CONFIRMED | Използва `where("siteId", "==", getSiteId())`. |
| **TI-03** | Sales (`sales-service.ts`) | `sales` | `createSiteQuery(getSalesCollection())` | ✅ CONFIRMED | Филтрирано коректно. |
| **TI-04** | Planner (`planner-service.ts`) | `exercises`, `training_sessions` | `where("siteId", "==", siteId)` | ✅ CONFIRMED | Всеки клон вижда само своите сесии и упражнения. |
| **TI-05** | Theory & Quizzes (`quiz-service.ts`) | `quizzes`, `theory_results` | `where("siteId", "==", siteId)` | ✅ CONFIRMED | `siteId` филтър на ниво заявка. Базовите тестове се сийдват за всеки активен клон. |
| **TI-06** | Settings & Families | `settings`, `families` | Global (No siteId filter in rules) | 🟢 INTENTIONAL | Глобални настройки за целия клуб. |
| **TI-07** | Custom Claims in Rules | All Site-Specific Collections | `hasAccessToSite(siteId)` | 🟠 **HIGH** | `firestore.rules` изисква Custom Claim `allowedSites`, но при стандартен вход този claim липсва, което би блокирало non-admin потребители при разделяне на правата по клонове. |
| **TI-08** | Zustand `activeBranch` state | Global UI | Switcher in `GlobalHeader` | ✅ CONFIRMED | Превключвателят актуализира Zustand state и опреснява данните. |
