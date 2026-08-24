# FORENSIC_UNCONFIRMED.md
## BKGalabovo2025 - Unconfirmed Findings Requiring Runtime Verification

### Summary

**Total Unconfirmed**: 8 findings  
**Requires**: Real Firebase project, environment variables, Java for emulators  
**Status**: Cannot be verified with static analysis alone

---

## Unconfirmed 1: Build Errors with Actual Environment

**Description**: Build passes with current `.env.local` but may fail with production environment variables.

**Why Unconfirmed**: 
- Current build uses `.env.local` which may have different values than production
- Firebase config validation in `firebase.ts:22-44` only runs in development
- Production may have missing or different env vars

**Verification Needed**:
```bash
# With production environment variables
npm run build
```

**Expected Result**: Build succeeds with all required env vars present

**Risk if Fails**: Deployment failures, runtime crashes

---

## Unconfirmed 2: TypeScript Typecheck with Full Environment

**Description**: Typecheck passes but may reveal issues with actual Firebase types.

**Why Unconfirmed**:
- Current typecheck uses local types
- Firebase Admin SDK types may differ with actual service account
- Some `any` types in firebase-admin.ts may hide issues

**Verification Needed**:
```bash
npm run typecheck
```

**Expected Result**: Zero TypeScript errors

**Risk if Fails**: Type safety gaps in production

---

## Unconfirmed 3: Firestore Security Rules Testing

**Description**: Firestore rules in `firestore.rules` cannot be tested without Java/Firebase emulators.

**Why Unconfirmed**:
- Rules define multi-tenant access control
- Critical for verifying site isolation
- Cannot test rules logic without emulators
- Rules testing requires Java runtime

**Verification Needed**:
```bash
# Requires Java installed
npm run test:rules
```

**Rules to Verify**:
- `isAdmin()` function works with custom claims
- `siteId` filtering on all collections
- `allowedSites` custom claim enforcement
- Public read access for `sessions`, `tournaments`, `quizzes`, `theory_results`
- Admin SDK bypass documentation

**Risk if Fails**: Security rules may not enforce tenant isolation correctly

---

## Unconfirmed 4: Integration Tests with Emulators

**Description**: Full integration tests require Firebase emulators (Auth, Firestore, Storage).

**Why Unconfirmed**:
- Tests use real Firebase SDK calls
- Need emulators for Auth, Firestore, Storage
- Requires Java runtime
- Current unit tests mock Firebase

**Verification Needed**:
```bash
# Requires Java installed
npm run test:integration
```

**Expected Result**: All integration tests pass with real Firebase behavior

**Risk if Fails**: Mock tests don't catch real Firebase behavior differences

---

## Unconfirmed 5: Actual Cron Job Execution

**Description**: Cron endpoints (`/api/cron/check-statuses`, `/api/cron/reminders`) need real execution verification.

**Why Unconfirmed**:
- Cron logic processes ALL members without site filter (FIND-005)
- Need to verify actual behavior with real data
- Vercel cron schedule in `vercel.json` needs verification
- `CRON_SECRET` validation in production

**Verification Needed**:
1. Deploy to Vercel with real Firebase project
2. Trigger cron manually via Vercel dashboard
3. Verify:
   - Only correct site's members processed
   - Member status updates correctly
   - Emails sent only for correct site
   - No cross-tenant data leakage

**Risk if Fails**: Cross-tenant member status corruption

---

## Unconfirmed 6: Email Sending End-to-End

**Description**: Email pipeline (`/api/send-email` → Nodemailer → SMTP) needs real verification.

**Why Unconfirmed**:
- Requires real SMTP credentials (Gmail App Password)
- Template rendering with React-Email needs verification
- Attachment handling needs testing
- BCC to admin archive needs verification

**Verification Needed**:
1. Configure real SMTP credentials in environment
2. Trigger `/api/send-email` with each template
3. Verify:
   - Emails delivered to recipients
   - Templates render correctly (HTML + text)
   - Attachments work
   - BCC received by admin
   - Error handling for invalid emails

**Risk if Fails**: Emails not sent, malformed emails, credentials issues

---

## Unconfirmed 7: Storage Upload/Download with Real Files

**Description**: Storage operations (`/api/upload` POST/DELETE) need real Firebase Storage verification.

**Why Unconfirmed**:
- Requires real Firebase Storage bucket
- Path validation with real siteId needs testing
- Public URL generation needs verification
- Delete operations need testing

**Verification Needed**:
1. Configure real Firebase Storage bucket
2. Test upload with authenticated user:
   - Valid path for user's site → should succeed
   - Invalid path for other site → should fail (FIND-006 fix)
3. Test download URL accessibility
4. Test delete operations
5. Verify CORS configuration

**Risk if Fails**: Upload/download failures, cross-tenant file access

---

## Unconfirmed 8: Authentication Flow with Real Firebase

**Description**: Complete auth flow (login → session cookie → protected routes) needs real Firebase Auth.

**Why Unconfirmed**:
- Requires real Firebase Auth project
- Session cookie creation/verification
- Token refresh behavior
- Logout flow
- Middleware protection with real sessions

**Verification Needed**:
1. Configure real Firebase Auth
2. Test login with valid credentials → session cookie set
3. Test login with invalid credentials → proper error
4. Access protected route with session → allowed
5. Access protected route without session → redirect to login
6. Test token refresh (10 min interval)
7. Test logout → session cleared, redirect to login
8. Test admin check with custom claims

**Risk if Fails**: Auth bypass, session issues, login/logout failures

---

## Verification Checklist

| Verification | Prerequisites | Command | Status |
|--------------|---------------|---------|--------|
| Build with prod env | Production env vars | `npm run build` | ❌ NOT DONE |
| Typecheck | Full env | `npm run typecheck` | ❌ NOT DONE |
| Firestore rules | Java + emulators | `npm run test:rules` | ❌ NOT DONE |
| Integration tests | Java + emulators | `npm run test:integration` | ❌ NOT DONE |
| Cron execution | Vercel + Firebase | Manual trigger | ❌ NOT DONE |
| Email E2E | SMTP credentials | Manual API call | ❌ NOT DONE |
| Storage ops | Firebase Storage | Manual API calls | ❌ NOT DONE |
| Auth flow | Firebase Auth | Browser testing | ❌ NOT DONE |

---

## Required Environment for Full Verification

### Java Runtime
```bash
# Install Java 17+ for Firebase emulators
# Windows: winget install Oracle.JDK.17
# Or download from adoptium.net
```

### Firebase Project
- Real Firebase project with:
  - Authentication enabled (Email/Password)
  - Firestore database
  - Storage bucket
  - Custom claims for admin (`admin: true`)

### Environment Variables (Production)
```env
# Client (NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Server
FIREBASE_SERVICE_ACCOUNT_JSON=  # Or FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL
CRON_SECRET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=  # Gmail App Password
SMTP_FROM=
ADMIN_ARCHIVE_EMAIL=
NEXT_PUBLIC_SITE_ID=bkgalabovo
```

### Vercel Configuration
- Cron jobs enabled in `vercel.json`
- Environment variables set in Vercel dashboard
- Domain configured

---

## Recommended Verification Order

1. **Install Java** → Enable emulator tests
2. **Run `npm run test:rules`** → Verify security rules
3. **Run `npm run test:integration`** → Verify integration behavior
4. **Deploy to Vercel preview** → Test with real Firebase
5. **Trigger cron jobs manually** → Verify site isolation
6. **Test email sending** → Verify templates and delivery
7. **Test storage upload/download** → Verify path validation
8. **Full auth flow testing** → Browser-based verification

---

## Risk Assessment

| Unconfirmed | Risk Level | Impact if Wrong |
|-------------|------------|-----------------|
| Build with prod env | HIGH | Deployment failure |
| Typecheck | MEDIUM | Runtime type errors |
| Firestore rules | CRITICAL | Security bypass, data leakage |
| Integration tests | HIGH | Uncaught Firebase behavior |
| Cron execution | CRITICAL | Cross-tenant data corruption |
| Email E2E | HIGH | Communication failures |
| Storage ops | HIGH | File access issues |
| Auth flow | CRITICAL | Auth bypass, session issues |

---

## Next Steps

1. **Immediate**: Install Java runtime to enable emulator tests
2. **Short-term**: Run `test:rules` and `test:integration`
3. **Medium-term**: Deploy to Vercel preview with real Firebase project
4. **Full verification**: Complete all 8 unconfirmed items

---

*Unconfirmed Findings Document: 2026-08-24*
*Status: 8 items requiring runtime verification with real Firebase project*
*Blocker: Java runtime required for Firebase emulators*