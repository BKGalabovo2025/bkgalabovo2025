# 08_RUNTIME_FLOW_FORENSIC.md
# BUSINESS LOGIC & RUNTIME FLOW FORENSIC REPORT

---

### 1. Business Flows Audit Table

| Бизнес Процес | Начална точка (UI) | Service / API | Database / Storage | Обработка на Резултата | Статус |
|---|---|---|---|---|---|
| **1. Вход в системата** | `src/app/login/page.tsx` | `loginAction` -> `signInWithEmailAndPassword` | Firebase Auth + Session Cookie | `router.push('/dashboard')` | ✅ **WORKING** |
| **2. Добавяне/редакция на член** | `MemberFormDialog.tsx` | `member-service.ts` (`addMember`/`updateMember`) | `members` collection | `onSave()` -> Toast -> Refresh list | ✅ **WORKING** |
| **3. Създаване на резервация** | `ReservationDialog.tsx` | `useReservationSubmit.ts` -> `saveReservation` | `reservations` collection | Toast -> `fetch(/api/send-email)` | 🟡 **PARTIAL** (Email грешките са silent) |
| **4. Регистриране на продажба**| `SalesClient.tsx` | `sales-service.ts` (`addSale`) | `sales` collection | Toast -> Обновяване на касовия дневник | ✅ **WORKING** |
| **5. Създаване на лагерна сесия**| `CampItineraryClient.tsx` | `schedule-service.ts` (`updateCampSessions`) | `events/{campId}` | Sanitize undefined -> `updateDoc` | ✅ **WORKING** |
| **6. Изпращане на тест по Viber**| `theory-client.tsx` | `quizService.submitResult` | `theory_results` (`SENT`) | Генерира URL -> Viber link | ✅ **WORKING** |
| **7. Попълване на тест от дете**| `QuizPlayer.tsx` | `quizService.submitTacticalAnswer` | `theory_results` (`PENDING`) | Показва резултат -> Мести в "За Проверка" | ✅ **WORKING** |
| **8. Оценяване и рецензия от треньор**| `theory-client.tsx` | `quizService.reviewResult` | `theory_results` (`REVIEWED`) | Записва manualScore -> Мести в "История" | ✅ **WORKING** |
| **9. Качване на фактура за командировка**| `BusinessTripManagerDialog.tsx` | `storage-service.ts` (`uploadFile`) | `/api/upload` -> Cloud Storage | URL се записва в `trip_expenses` | ✅ **WORKING** |
| **10. Автоматична деактивация на членове**| Vercel Cron | `/api/cron/check-statuses` | `members` (batch update) | Актуализира статус при 30+ дни неактивност | ✅ **WORKING** |
| **11. Изпращане на месечен протокол** | `AccountingClient.tsx` | `html-to-pdf.ts` -> `/api/send-email` | SMTP Nodemailer | PDF Base64 прикачен файл към имейл | ✅ **WORKING** |
| **12. Турнирно точкуване и мачове** | `TournamentClient.tsx` | `tournament-service.ts` | `tournament_matches` | Преизчислява схема и класиране | ✅ **WORKING** |
