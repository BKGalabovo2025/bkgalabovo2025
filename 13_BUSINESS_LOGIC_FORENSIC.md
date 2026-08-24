# 13_BUSINESS_LOGIC_FORENSIC.md
# BUSINESS LOGIC & STATE MACHINES FORENSIC REPORT

---

### 1. State Machine: Theory & Quiz Module (`TheoryResultStatus`)

```
               (Coach sends quiz)
                    │
                    ▼
               [ "SENT" ]  <── Tracked in "Sent" tab in theory-client.tsx
                    │
                    ▼ (Student completes & submits test on public /quiz/[token])
              [ "PENDING" ] <── Appears in "For Review" tab
                    │
                    ▼ (Coach provides manual score & feedback)
             [ "REVIEWED" ] <── Moves to "History" tab
```

- **Forensic Проверка**: Всички 3 статуса са дефинирани в `TheoryResultStatusSchema` (`src/types/quiz.types.ts`). Преходите се осъществяват последователно и не позволяват прескачане на стъпки (няма `REVIEWED` без предварително предаден тест).
- **Статус**: ✅ **WORKING AS DESIGNED**.

---

### 2. State Machine: Member Status Lifecycle (`active` vs `inactive`)

```
                 (New Member created)
                         │
                         ▼
                   [ "active" ]
                         │
        (30+ days without sales OR event attendance)
                         │
                         ▼ (Vercel Cron: /api/cron/check-statuses)
                  [ "inactive" ]
                         │
        (New sale recorded OR attended training)
                         │
                         ▼ (Automatic reactivation)
                   [ "active" ]
```

- **Forensic Проверка**: `processMemberStatus` в `src/app/api/cron/check-statuses/route.ts:58-77` проверява датите с часова зона `Europe/Sofia`. Актуализира бележките на члена и променя статуса в batch транзакция.
- **Статус**: ✅ **WORKING AS DESIGNED**.
