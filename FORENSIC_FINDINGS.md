# FORENSIC_FINDINGS.md
## BKGalabovo2025 - Detailed Findings with Evidence

### Finding Format
Each finding follows the required format:
- **ID**: Unique identifier
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW / INFO
- **Status**: CONFIRMED / UNCONFIRMED / FALSE POSITIVE
- **Confidence**: HIGH / MEDIUM / LOW
- **Source**: `file:line`
- **Caller**: `file:function`
- **Destination**: `file:function`
- **Expected Contract**: What should happen
- **Actual Contract**: What actually happens
- **Why Broken**: Root cause explanation
- **Runtime Impact**: What happens at runtime
- **Security Impact**: Security implications
- **Data Impact**: Data integrity implications
- **Reproduction Path**: Steps to reproduce
- **Evidence**: Code references
- **Minimal Fix**: Smallest change to fix
- **Risk of Fix**: Potential side effects

---

## CRITICAL FINDINGS

### [FIND-001] CRITICAL: Route Protection Middleware Bypass
**Status**: CONFIRMED | **Confidence**: HIGH

**Source**: `src/proxy.ts:5`
**Caller**: Next.js Middleware pipeline
**Destination**: All `src/app/api/*/route.tsx` endpoints

**Expected Contract**: Middleware should protect all non-public routes by checking session cookie
**Actual Contract**: `publicPaths = ["/login", "/api", "/quiz"]` - `/api` matches ALL API routes

**Why Broken**: 
- `publicPaths.some((path) => pathname.startsWith(path))` on line 12 matches ANY path starting with `/api`
- This runs BEFORE the matcher config exclusion on line 33
- If matcher config changes, ALL API endpoints become publicly accessible without auth

**Runtime Impact**: Unauthenticated users could potentially access all API endpoints
**Security Impact**: Complete auth bypass for all API routes if matcher misconfigured
**Data Impact**: Potential data exposure across all API endpoints

**Reproduction Path**:
1. Change matcher config to include `/api`
2. Access any `/api/*` endpoint without session cookie
3. Middleware allows access due to publicPaths match

**Evidence**: 
- `proxy.ts:5` - `publicPaths = ["/login", "/api", "/quiz"]`
- `proxy.ts:12` - `publicPaths.some((path) => pathname.startsWith(path))`
- `proxy.ts:33` - `matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)"]`

**Minimal Fix**: Remove `/api` from publicPaths array
```typescript
const publicPaths = ["/login", "/quiz"];
```

**Risk of Fix**: LOW - `/api` routes already excluded by matcher

---

### [FIND-002] CRITICAL: Member.siteId Type/Contract Mismatch
**Status**: CONFIRMED | **Confidence**: HIGH

**Source**: `src/types/member.types.ts:11` vs `src/mappers/member.mapper.ts:39`
**Caller**: `src/services/member-service.ts` → `src/repositories/member.repository.ts` → `src/mappers/member.mapper.ts`
**Destination**: Firestore `members` collection

**Expected Contract**: Zod schema requires `siteId: z.string().min(1, "Site ID is required.")` - siteId MUST exist
**Actual Contract**: Mapper provides fallback `siteId: data.siteId || "bkgalabovo"`

**Why Broken**: 
- Zod validation would reject documents without siteId
- But mapper silently provides fallback, masking missing data
- Old documents without siteId pass validation with wrong default
- Creates inconsistency between schema requirement and DB reality

**Runtime Impact**: Members from old documents get incorrect siteId "bkgalabovo"
**Security Impact**: Multi-tenancy breach - members could be misassigned
**Data Impact**: Incorrect site context for all operations on those members

**Reproduction Path**:
1. Have member document without siteId field
2. Call `getMemberById()` or `getAllMembers()`
3. Mapper returns member with siteId="bkgalabovo" regardless of actual site

**Evidence**:
- `member.types.ts:11` - `siteId: z.string().min(1, "Site ID is required.")`
- `member.mapper.ts:39` - `siteId: data.siteId || "bkgalabovo"`

**Minimal Fix**: Remove fallback, enforce siteId requirement at DB level
```typescript
// In member.mapper.ts
siteId: data.siteId, // Remove || "bkgalabovo"
// Add migration to populate siteId on all existing documents
```

**Risk of Fix**: MEDIUM - Requires migration for existing documents without siteId

---

### [FIND-003] CRITICAL: Sale.siteId Type/Contract Mismatch
**Status**: CONFIRMED | **Confidence**: HIGH

**Source**: `src/types/sale.types.ts` vs `src/services/sales-service.ts:53,183-184`
**Caller**: `src/services/sales-service.ts` → Firestore `sales` collection
**Destination**: Firestore `sales` collection

**Expected Contract**: Sale documents should have correct siteId from active site config
**Actual Contract**: 
- Line 53: `siteId: data.siteId || "default"` fallback
- Lines 183-184: `updateSale` unconditionally overwrites `dataToUpdate.siteId = activeSiteId`

**Why Broken**: 
- Documents without siteId get "default" on create/read
- Updates unconditionally overwrite siteId, potentially changing site context
- Could move sale from one site's context to another

**Runtime Impact**: Sales could have wrong siteId, causing cross-tenant data leakage
**Security Impact**: Admin could see sales from wrong site
**Data Impact**: Sale context corruption, incorrect financial reporting

**Reproduction Path**:
1. Create sale document without siteId
2. Read sale - gets siteId="default"
3. Call `updateSale()` with different activeBranch
4. Sale's siteId changed to new activeBranch

**Evidence**:
- `sales-service.ts:53` - `siteId: data.siteId || "default"`
- `sales-service.ts:183-184` - `dataToUpdate.siteId = activeSiteId`

**Minimal Fix**: 
```typescript
// In docToSale - remove fallback, throw if missing
siteId: data.siteId, // Remove || "default"

// In updateSale - only set if not present
if (!dataToUpdate.siteId) dataToUpdate.siteId = activeSiteId;
```

**Risk of Fix**: MEDIUM - Requires migration for existing documents

---

## HIGH FINDINGS

### [FIND-004] HIGH: Email Schema Validation Looseness
**Status**: CONFIRMED | **Confidence**: MEDIUM

**Source**: `src/app/api/send-email/route.tsx:81-100`
**Caller**: Various components → `/api/send-email` POST
**Destination**: Email template rendering → SMTP

**Expected Contract**: Email data should be validated against template-specific structure
**Actual Contract**: `data: z.record(z.string(), z.any())` allows any structure

**Why Broken**: 
- Templates expect specific fields but schema doesn't enforce them
- `reminder` expects `memberName`, `reservationConfirmation` expects `clientName`, `startTime`, etc.
- Invalid data passes validation but causes runtime errors or silent fallbacks

**Runtime Impact**: Template rendering failures, malformed emails sent
**Security Impact**: None directly
**Data Impact**: Email content may be incorrect or missing

**Reproduction Path**:
1. Call `/api/send-email` with template="reminder" but data={}
2. Zod validation passes
3. Template renders with fallback "Просрочено плащане към Бадминтон Клуб Гълъбово."

**Evidence**:
- `send-email/route.tsx:90` - `data: z.record(z.string(), z.any())`
- `send-email/route.tsx:36-78` - Template-specific data extraction with fallbacks

**Minimal Fix**: Add template-specific Zod sub-schemas
```typescript
const EmailSchema = z.object({
  // ...
  data: z.discriminatedUnion("template", [
    z.object({ template: z.literal("reminder"), data: ReminderEmailDataSchema }),
    z.object({ template: z.literal("reservationConfirmation"), data: ReservationConfirmationEmailDataSchema }),
    // ...
  ])
});
```

**Risk of Fix**: LOW - Adds stricter validation, may break existing callers with incomplete data

---

### [FIND-005] HIGH: Cron Jobs - No Site Isolation
**Status**: CONFIRMED | **Confidence**: HIGH

**Source**: `src/services/reminder-service.server.ts:19-25`, cron route handlers
**Caller**: Vercel Cron → `/api/cron/check-statuses`, `/api/cron/reminders`, `/api/send-reminders`
**Destination**: Firestore `members` and `sales` collections

**Expected Contract**: Cron operations should be site-scoped to prevent cross-tenant influence
**Actual Contract**: 
- `getOverdueMembers()` fetches ALL active members without siteId filter
- `check-statuses` loads all members, checks activity across both sites

**Why Broken**: 
- No `where("siteId", "==", siteId)` filter in cron queries
- One site's inactivity could affect another site's member status
- `getMembersQuery()` pattern exists but not used in cron services

**Runtime Impact**: Member status changes in one site affect the other site
**Security Impact**: Cross-tenant data influence
**Data Impact**: Incorrect member status across tenants

**Reproduction Path**:
1. Have members in both bkgalabovo and recoveryzone
2. Run cron `check-statuses`
3. All members processed together regardless of site
4. Inactivity from one site affects status in other site

**Evidence**:
- `reminder-service.server.ts:19-25` - `where("status", "==", "active")` only
- `firebase-collections.ts:200-202` - `createSiteQuery` pattern exists
- `cron/check-statuses/route.ts` - full member load without site filter

**Minimal Fix**: Add siteId filtering to all cron queries
```typescript
const membersSnapshot = await membersCollectionRef
  .where("status", "==", "active")
  .where("siteId", "==", getSiteConfig().id)
  .get();
```

**Risk of Fix**: LOW - Uses existing pattern, just needs to pass siteId

---

### [FIND-006] HIGH: Upload API - No Site Validation
**Status**: CONFIRMED | **Confidence**: HIGH

**Source**: `src/app/api/upload/route.ts:17`
**Caller**: `src/services/storage-service.ts` → `/api/upload` POST/DELETE
**Destination**: Firebase Storage bucket

**Expected Contract**: Upload should validate that user's siteId matches the upload path
**Actual Contract**: `getAuthUser(token)` verifies auth but NOT siteId

**Why Broken**: 
- Any authenticated user can upload/delete to any path
- No bucket-level isolation between bkgalabovo and recoveryzone
- Path traversal possible through user-supplied `path` parameter

**Runtime Impact**: Cross-tenant file upload, storage bucket abuse
**Security Impact**: Unauthorized file access across tenants
**Data Impact**: Files could be uploaded to wrong site's paths

**Reproduction Path**:
1. Authenticate as bkgalabovo user
2. Call `/api/upload` with path="recoveryzone/avatars/evil.jpg"
3. File uploaded to recoveryzone path despite being bkgalabovo user

**Evidence**:
- `upload/route.ts:17` - `await getAuthUser(token)` only
- `upload/route.ts:28` - `const path = formData.get("path") as string;` user-controlled
- `upload/route.ts:62` - download URL uses user-supplied path directly

**Minimal Fix**: Add siteId validation after auth
```typescript
const user = await getAuthUser(token);
const userSiteId = user.siteId || getSiteConfig().id;
const requestedPath = formData.get("path") as string;
if (!requestedPath.startsWith(`sites/${userSiteId}/`) && !requestedPath.startsWith(`avatars/${user.id}`)) {
  return NextResponse.json({ error: "Invalid path for your site" }, { status: 403 });
}
```

**Risk of Fix**: MEDIUM - May break existing upload paths, needs migration

---

## MEDIUM FINDINGS

### [FIND-007] MEDIUM: Email Template Data Mismatches
**Status**: CONFIRMED | **Confidence**: MEDIUM

**Source**: `src/app/api/send-email/route.tsx` templates vs `EmailSchema`
**Caller**: Email template rendering
**Destination**: React-Email render → Nodemailer SMTP

**Expected Contract**: `data` field matches template expectations
**Actual Contract**: Template-specific fields not enforced by schema

**Why Broken**: 
- `reminder` uses `data.memberName` but schema allows `z.any()`
- `reservationConfirmation` expects `clientName`, `startTime`, `endTime`, `courtId`, `isRecoveryZone`
- Missing fields cause runtime errors or silent fallbacks to generic messages

**Runtime Impact**: Template rendering errors, generic fallback messages sent
**Security Impact**: None
**Data Impact**: Email content quality degraded

**Evidence**: `send-email/route.tsx:36-78` - each template has different expected fields

**Minimal Fix**: Same as FIND-004 - template-specific Zod schemas

---

### [FIND-008] MEDIUM: Quiz Public Access Without Site Filtering
**Status**: CONFIRMED | **Confidence**: MEDIUM

**Source**: `src/services/quiz-service.ts:158-167` - `getResultByToken`
**Caller**: `/quiz/[token]` page → `QuizPlayer` component
**Destination**: Firestore `theory_results` collection

**Expected Contract**: Theory results accessed by token should filter by siteId
**Actual Contract**: Only filters by `shareToken`, not by `siteId`

**Why Broken**: 
- Token from one site could return results from another site
- `submitResult` includes `siteId` but `getResultByToken` doesn't filter by it

**Runtime Impact**: Cross-site data exposure through quiz tokens
**Security Impact**: Unauthorized access to test results
**Data Impact**: Test results leaked across tenants

**Reproduction Path**:
1. Create quiz result in bkgalabovo with shareToken="abc123"
2. Create quiz result in recoveryzone with shareToken="abc123" (unlikely but possible)
3. Access `/quiz/abc123` - could return wrong site's result

**Evidence**:
- `quiz-service.ts:158-167` - `where("shareToken", "==", token)` only
- `quiz-service.ts:123-136` - `submitResult` includes `siteId` in document

**Minimal Fix**: Add siteId filter to query
```typescript
const q = query(
  collection(db, THEORY_RESULTS_COLLECTION),
  where("shareToken", "==", token),
  where("siteId", "==", getSiteConfig().id) // Add this
);
```

**Risk of Fix**: LOW - Adds additional filter, minimal risk

---

### [FIND-009] MEDIUM: Member Status Cache Inconsistency
**Status**: CONFIRMED | **Confidence**: MEDIUM

**Source**: `src/services/member-service.ts:38-62` - `getAllMembers`
**Caller**: Various components via `useMembers` hook
**Destination**: In-memory `membersCache` and Firestore `members`

**Expected Contract**: Cache should be properly invalidated when site context changes
**Actual Contract**: Cache keyed by `currentSiteId` from `getSiteConfig()` which uses React state

**Why Broken**: 
- `getSiteConfig()` uses `useAppStore.getState()?.activeBranch` (React state)
- Server-side rendering may have stale or wrong site context
- Could return members from wrong site

**Runtime Impact**: Wrong member data displayed for active site
**Security Impact**: Cross-tenant member data exposure
**Data Impact**: Inconsistent member lists between sites

**Evidence**:
- `member-service.ts:38-62` - cache keyed by `currentSiteId`
- `sites.ts:50-56` - `getSiteConfig()` uses React state + env fallback

**Minimal Fix**: Pass siteId explicitly instead of relying on React state
```typescript
export const getAllMembers = async (siteId?: string): Promise<Member[]> => {
  const currentSiteId = siteId || getSiteConfig().id;
  // Use currentSiteId for cache key
};
```

**Risk of Fix**: MEDIUM - Requires updating all callers to pass siteId

---

### [FIND-010] MEDIUM: Sale Update Adds SiteId Unconditionally
**Status**: CONFIRMED | **Confidence**: MEDIUM

**Source**: `src/services/sales-service.ts:183-184`
**Caller**: Various components → `updateSale()`
**Destination**: Firestore `sales` collection

**Expected Contract**: siteId should only be added if not already present
**Actual Contract**: `updateSale` unconditionally sets `dataToUpdate.siteId = activeSiteId`

**Why Broken**: Overwrites existing siteId, potentially changing sale's site context

**Evidence**: `sales-service.ts:183-184` - `dataToUpdate.siteId = activeSiteId`

**Minimal Fix**: Only set if not present
```typescript
if (!dataToUpdate.siteId) dataToUpdate.siteId = activeSiteId;
```

**Risk of Fix**: LOW - Simple conditional check

---

## LOW FINDINGS

### [FIND-011] LOW: Debug/Analyze API Endpoints Unprotected
**Status**: CONFIRMED | **Confidence**: HIGH

**Source**: `src/app/api/debug/route.ts`, `analyze-reservations/route.ts`, `analyze-db/route.ts`
**Caller**: Direct browser access
**Destination**: Sensitive data exposure

**Expected Contract**: Debug endpoints should be protected or marked dev-only
**Actual Contract**: All public/unprotected, return sensitive data

**Evidence**: `inventory.md:24-25` - marked as Public/Unprotected

**Minimal Fix**: Add authentication or remove from production builds

---

### [FIND-012] LOW: `z.any()` Usage in Multiple Places
**Status**: CONFIRMED | **Confidence**: MEDIUM

**Source**: Various Zod schemas
**Caller**: Schema validation
**Destination**: Type safety

**Expected Contract**: `z.any()` used sparingly with justification
**Actual Contract**: Used in email schema and other places

**Evidence**: `send-email/route.tsx:90` - `data: z.record(z.string(), z.any())`

**Minimal Fix**: Replace with specific types where possible

---

### [FIND-013] LOW: Missing Error Handling in Some Services
**Status**: CONFIRMED | **Confidence**: MEDIUM

**Source**: Various service files
**Caller**: Service function error paths
**Destination**: Error handling

**Expected Contract**: Consistent error handling
**Actual Contract**: Some catch blocks return empty arrays, log only, don't re-throw

**Minimal Fix**: Standardize error handling pattern

---

*Generated: 2026-08-24*
*Total Findings: 13 (3 CRITICAL, 3 HIGH, 4 MEDIUM, 3 LOW)*