# 09_DEAD_LEGACY_ORPHAN_FORENSIC.md
# DEAD CODE, LEGACY & ORPHANED ASSETS FORENSIC REPORT

---

### 1. Категоризация на Мъртвия и Неизползван Код

#### А. Опасен Неизползван Код (Dangerous Dead Code)
1. **`/api/debug/route.ts`**: Връща клиентски данни за резервации без автентикация.
2. **`/api/analyze-reservations/route.ts`**: Връща JSON дъм на резервации без автентикация.
3. **`/api/seed/route.ts`**: Изтрива и презаписва колекция `exercises` без проверка на права.

#### Б. Безопасен Неизползван Код (Safe Dead Code)
1. **`/api/analyze-db/route.ts`**: Празен файл връщащ `"OK"`.
2. **`/api/services/[serviceId]/route.ts`**: REST API endpoint за услуги, който не се вика от нито един компонент (всички четат директно през Firestore SDK).
3. **`scratch_fix.mjs` & `disable_lints.mjs`**: Временни JS скриптове в корена на проекта, използвани по време на разработка.
4. **`src/app/api/members/route.ts`**: Сървърен POST маршрут за добавяне на членове, дублиращ се с `addMember()` в `member-service.ts`.
