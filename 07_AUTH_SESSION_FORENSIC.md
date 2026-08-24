# 07_AUTH_SESSION_FORENSIC.md
# AUTHENTICATION & SESSION MANAGEMENT FORENSIC REPORT

---

### 1. Dual-Authentication Flow Architecture

```
[User Login Form]
       │
       ▼ (1) loginAction(email, password) [Server Action]
   Calls Firebase REST API (`/accounts:signInWithPassword`)
   Validates credentials & returns idToken
   Creates 5-day HTTP-only `session` cookie via Firebase Admin
       │
       ▼ (2) signInWithEmailAndPassword(auth, email, password) [Client SDK]
   Synchronizes client-side `AuthContext` (`onIdTokenChanged`)
       │
       ▼ (3) Protected Navigation
   ProtectedLayoutClient validates client `user` state
   Middleware (intended via proxy.ts) checks `session` cookie
```

---

### 2. Forensic Findings & Edge Cases in Auth

1. **Dual-Session Invalidation on Logout**:
   - При изход (`logout()` в `AuthContext`), се изпълняват едновременно:
     1. `firebaseSignOut(auth)` за изчистване на локалния клиентски потребител.
     2. `fetch("/api/auth/logout", { method: "POST" })` за изтриване на HTTP-only `session` cookie-то.
   - **Оценка**: ✅ Коректно и пълно изчистване от двете страни.

2. **Периодичен Token Refresh**:
   - `AuthContext` съдържа интервал на всеки 10 минути (`setInterval`), който вика `currentUser.getIdToken(true)`.
   - При липса на мрежа (`!navigator.onLine`) опресняването се пропуска без грешка.
   - **Оценка**: ✅ Предотвратява изтичане на токена при дълги сесии.

3. **Липса на Edge Middleware Interceptor**:
   - Тъй като `src/proxy.ts` не е именуван `middleware.ts`, Next.js Edge runtime не блокира директни HTTP заявки без `session` бисквитка. Защитата пада изцяло върху React клиента в `ProtectedLayoutClient.tsx`.
