# 10_REMEDIATION_PLAN.md
# ПЛАН ЗА ОТСТРАНЯВАНЕ НА ОТКРИТИТЕ НЕСЪОТВЕТСТВИЯ (REMEDIATION PLAN)

> ⚠️ **ЗАБЕЛЕЖКА**: В съответствие с изискването за ОДИТ ФАЗА, този документ описва препоръчителните стъпки без да прави промени по продукционния код на този етап.

---

### Фаза 1: Спешни Действия за Сигурност (Immediate Fixes - Severity: CRITICAL & HIGH)

1. **Премахване/Обезопасяване на Debug Endpoints**:
   - Изтриване на `src/app/api/debug/route.ts` и `src/app/api/analyze-reservations/route.ts` или добавяне на `await ensureAdmin(token)`.
2. **Активиране на Next.js Edge Middleware**:
   - Преименуване на `src/proxy.ts` -> `src/middleware.ts` и експортиране на `export function middleware(request: NextRequest)` за автоматично прехващане на неавтентикирани заявки още на ниво сървърен Edge рутер.
3. **Обезопасяване на `/api/seed`**:
   - Добавяне на `await ensureAdmin(token)` в `src/app/api/seed/route.ts`.
4. **Корекция на Multi-tenancy в `firestore.rules`**:
   - Актуализиране на помощната функция `hasAccessToSite(siteId)` да допуска админи или да не изисква строго `allowedSites` при стандартни потребители.

---

### Фаза 2: Подобряване на Надеждността и Контрактите (Severity: MEDIUM)

1. **Строга Zod валидация в `/api/send-email`**:
   - Дефиниране на отделни схеми за всеки шаблон (`reminder`, `reservationConfirmation`, `deactivated`, `marketing`) чрез `z.discriminatedUnion("template", [...])`.
2. **Error Handling при изпращане на имейл за резервация**:
   - В `useReservationSubmit.ts` да се добави `try/catch` около `fetch("/api/send-email")` и потребителят да бъде информиран, ако имейлът не се изпрати.

---

### Фаза 3: Почистване на Мъртъв Код (Severity: LOW)

1. Премахване на `src/app/api/analyze-db/route.ts` и `src/app/api/services/[serviceId]/route.ts`.
2. Премахване на помощните скриптове `scratch_fix.mjs` и `disable_lints.mjs`.
