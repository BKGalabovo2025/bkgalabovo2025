# 12_UNCONFIRMED_FINDINGS.md
# НЕПОТВЪРДЕНИ ХИПОТЕЗИ И FALSE POSITIVE CONTROL (UNCONFIRMED FINDINGS)

Този документ съдържа списък на първоначални подозрения, които бяха **детайлно проверени и отхвърлени (disproven)** като реални счупвания:

---

### 1. Хипотеза: "Турнирният мапър и ранглистата не са синхронизирани с новия `countsForRanking` флаг"
- **Първоначално подозрение**: `computeGlobalRankings` в `ranking-service.ts` може да чете невалидни дати или незавършени турнири.
- **Forensic Проверка**:
  - `ranking-service.ts:24-28` съдържа строг Firestore query: `where("countsForRanking", "==", true), where("status", "==", "completed")`.
  - Мапването минава през `mapDocToTournament` (`src/mappers/tournament.mapper.ts`), където `startDate` се валидира със Zod `TournamentSchema` и безопасно конвертира `Timestamp` към `ISO string`.
- **Резултат**: ❌ **FALSE POSITIVE** (Логиката е 100% работеща и защитена с fallback).

---

### 2. Хипотеза: "Записът на бързи лагерни сесии чупи Firestore заради `undefined` полета в групите"
- **Първоначално подозрение**: `CampItineraryClient.tsx` изпраща `groups: undefined` при липса на дефинирани групи.
- **Forensic Проверка**:
  - В `CampItineraryClient.tsx` обектът `newSession` се конструира с conditional spread:
    `...(groups && groups.length > 0 ? { groups } : {})`.
  - В `schedule-service.ts:80-92` данните допълнително се сериализират през `JSON.parse(JSON.stringify(campSessions))`.
- **Резултат**: ❌ **FALSE POSITIVE** (Проблемът е окончателно решен и тестван).

---

### 3. Хипотеза: "Липсва потребителски ID токен при триене на файл от Storage през `deleteFile`"
- **Първоначално подозрение**: `deleteFile` в `storage-service.ts` не изпраща `Authorization` заглавка.
- **Forensic Проверка**:
  - `storage-service.ts:40-47` приема `idToken?: string | null` и добавя `headers["Authorization"] = Bearer ${idToken}`.
  - В `BusinessTripManagerDialog.tsx` токенът се извлича с `user.getIdToken()` преди повикването.
- **Резултат**: ❌ **FALSE POSITIVE** (Работи коректно).
