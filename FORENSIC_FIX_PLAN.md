# FORENSIC_FIX_PLAN.md
## BKGalabovo2025 - Prioritized Fix Plan

### Overview

**Total Fixes**: 25+ actionable items  
**Priority Levels**: P0 (Immediate) → P3 (Technical Debt)  
**Approach**: Minimize risk of breaking other bridges while fixing root causes  
**Dependencies**: Some fixes must be done in order due to cross-cutting concerns

---

## P0 - IMMEDIATE (Before Any Deploy)

These fixes address critical system-breaking issues and security bypasses.

### P0-1: Fix Route Protection Middleware Bypass
**Finding**: FIND-001 (CRITICAL)
**File**: `src/proxy.ts:5`
**Root Cause**: `/api` in `publicPaths` matches all API routes before matcher exclusion

**Fix**:
```typescript
// BEFORE (line 5)
const publicPaths = ["/login", "/api", "/quiz"];

// AFTER
const publicPaths = ["/login", "/quiz"];
```

**Risk**: LOW - `/api` routes already excluded by matcher config
**Verification**: Confirm middleware still protects protected routes, API routes still accessible

---

### P0-2: Add Template-Specific Email Validation
**Finding**: FIND-004 (HIGH)
**File**: `src/app/api/send-email/route.tsx:81-100`
**Root Cause**: `z.record(z.string(), z.any())` allows any data structure

**Fix**: Replace loose schema with discriminated union:
```typescript
// Define template-specific data schemas
const ReminderEmailDataSchema = z.object({
  memberName: z.string().min(1),
  // ... other reminder fields
});

const ReservationConfirmationEmailDataSchema = z.object({
  clientName: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  courtId: z.string().min(1),
  isRecoveryZone: z.boolean().optional(),
});

// Main schema with discriminated union
const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  template: z.enum(["reminder", "reservationConfirmation", "deactivated", "marketing"]),
  data: z.discriminatedUnion("template", [
    z.object({ template: z.literal("reminder"), data: ReminderEmailDataSchema }),
    z.object({ template: z.literal("reservationConfirmation"), data: ReservationConfirmationEmailDataSchema }),
    z.object({ template: z.literal("deactivated"), data: DeactivatedEmailDataSchema }),
    z.object({ template: z.literal("marketing"), data: MarketingEmailDataSchema }),
  ]),
  attachments: z.array(...).optional(),
});
```

**Risk**: MEDIUM - May break existing callers with incomplete data
**Mitigation**: Add optional fields with defaults, test all current callers

---

### P0-3: Fix Member.siteId Type/Contract Mismatch
**Finding**: FIND-002 (CRITICAL)
**Files**: `src/mappers/member.mapper.ts:39`, `src/types/member.types.ts:11`
**Root Cause**: Mapper fallback masks schema requirement

**Fix**:
1. Remove fallback in mapper:
```typescript
// BEFORE (line 39)
siteId: data.siteId || "bkgalabovo",

// AFTER
siteId: data.siteId, // Remove fallback
```

2. Run migration to populate siteId on all existing members:
```typescript
// Migration script
const members = await getAllMembersServer();
for (const member of members) {
  if (!member.siteId) {
    await updateMemberDocument(member.id, { siteId: "bkgalabovo" });
  }
}
```

3. Make Zod schema accept siteId as required (already done)

**Risk**: HIGH - Requires migration, may affect existing documents
**Mitigation**: Run migration in transaction, test on staging first

---

### P0-4: Fix Sale.siteId Unconditional Overwrite
**Finding**: FIND-003 (CRITICAL)
**File**: `src/services/sales-service.ts:183-184`
**Root Cause**: `updateSale` unconditionally overwrites siteId

**Fix**:
```typescript
// BEFORE (lines 183-184)
const activeSiteId = getSiteConfig().id;
dataToUpdate.siteId = activeSiteId;

// AFTER
if (!dataToUpdate.siteId) {
  dataToUpdate.siteId = getSiteConfig().id;
}
```

**Risk**: LOW - Simple conditional check
**Verification**: Test updateSale with and without existing siteId

---

## P1 - BEFORE PRODUCTION

These fixes address core functionality and security gaps.

### P1-1: Add Site Validation to Upload API
**Finding**: FIND-006 (HIGH)
**File**: `src/app/api/upload/route.ts`
**Root Cause**: No siteId validation after authentication

**Fix**:
```typescript
// After getAuthUser(token) on line 17
const user = await getAuthUser(token);
const userSiteId = user.siteId || getSiteConfig().id;

const path = formData.get("path") as string;
// Validate path belongs to user's site
const allowedPrefixes = [
  `sites/${userSiteId}/`,
  `avatars/${user.uid}/`,  // User's own avatar
  `business-trips/${user.uid}/`,  // User's own trips
];

const isValidPath = allowedPrefixes.some(prefix => path.startsWith(prefix));
if (!isValidPath) {
  return NextResponse.json(
    { success: false, error: "Invalid path for your site" },
    { status: 403 }
  );
}
```

**Risk**: MEDIUM - May break existing upload paths
**Mitigation**: Audit current upload paths, create migration if needed

---

### P1-2: Add Site Filtering to Cron Jobs
**Finding**: FIND-005 (HIGH)
**Files**: `src/services/reminder-service.server.ts`, `src/app/api/cron/check-statuses/route.ts`, `src/app/api/cron/reminders/route.ts`
**Root Cause**: Cron queries don't filter by siteId

**Fix**:
```typescript
// In reminder-service.server.ts getOverdueMembers()
const membersSnapshot = await membersCollectionRef
  .where("status", "==", "active")
  .where("siteId", "==", getSiteConfig().id)  // ADD THIS
  .get();

// In cron/check-statuses/route.ts
const membersQuery = getMembersQuery();  // Already has site filter via createSiteQuery()

// In cron/reminders/route.ts
// Ensure getOverdueMembers() receives siteId or uses getSiteConfig()
```

**Risk**: LOW - Uses existing `createSiteQuery()` pattern
**Verification**: Test cron with members from both sites

---

### P1-3: Add Site Filter to Quiz Token Lookup
**Finding**: FIND-008 (MEDIUM)
**File**: `src/services/quiz-service.ts:158-167`
**Root Cause**: `getResultByToken` only filters by token

**Fix**:
```typescript
async getResultByToken(token: string, siteId?: string): Promise<TheoryResult | null> {
  const q = query(
    collection(db, THEORY_RESULTS_COLLECTION),
    where("shareToken", "==", token),
    ...(siteId ? [where("siteId", "==", siteId)] : [])  // Add site filter
  );
  // ...
}
```

**Risk**: LOW - Additional filter only
**Verification**: Test token lookup from both sites

---

### P1-4: Enhance Admin Authorization with Site Context
**Finding**: Security Matrix - Admin SDK authorization granularity
**Files**: All Admin SDK endpoints
**Root Cause**: `ensureAdmin()` only checks `user.admin || user.email`, no site validation

**Fix**: Create site-aware admin check:
```typescript
// In auth-utils.ts
export async function ensureAdminWithSite(
  idToken: string, 
  requiredSiteId?: string
) {
  const user = await getAuthUser(idToken);
  if (!user.admin && user.email !== "bkgalabovo2014@gmail.com") {
    throw new Error("Нямате администраторски права.");
  }
  // If siteId required, verify user has access
  if (requiredSiteId && user.allowedSites && !user.allowedSites.includes(requiredSiteId)) {
    throw new Error("Нямате достъп до този клон.");
  }
  return user;
}

// Update all Admin SDK endpoints to use this
```

**Risk**: MEDIUM - Changes auth logic across endpoints
**Mitigation**: Update one endpoint at a time, test thoroughly

---

## P2 - NEXT DEVELOPMENT CYCLE

These fixes improve robustness and multi-tenancy.

### P2-1: Fix Member Cache Site Context
**Finding**: FIND-009 (MEDIUM)
**File**: `src/services/member-service.ts:38-62`
**Root Cause**: Cache depends on React state `activeBranch`

**Fix**:
```typescript
// Add explicit siteId parameter
export const getAllMembers = async (
  siteId?: string,
  forceRefetch = false
): Promise<Member[]> => {
  const currentSiteId = siteId || getSiteConfig().id;
  // Use currentSiteId for cache key
};

// Update all callers to pass siteId explicitly
```

**Risk**: MEDIUM - Requires updating all callers
**Mitigation**: Make siteId optional with fallback, update callers incrementally

---

### P2-2: Fix Sale Update siteId Conditional
**Finding**: FIND-010 (MEDIUM) - DUPLICATE OF P0-4
**Already fixed in P0-4**

---

### P2-3: Add SiteId to Session Cookie Verification
**Finding**: Security Matrix - Session cookie lacks site context
**Files**: `src/lib/auth-utils.ts`, `src/context/auth-context.tsx`
**Root Cause**: Session cookie doesn't guarantee siteId

**Fix**:
```typescript
// In auth-utils.ts getAuthUserFromSessionCookie()
export async function getAuthUserFromSessionCookie(): Promise<DecodedToken | null> {
  // ... existing code
  const decodedToken = await adminAuth.verifySessionCookie(session, false);
  
  // Add siteId if missing from token
  if (!decodedToken.siteId) {
    // Could derive from user's allowedSites or default
    decodedToken.siteId = decodedToken.allowedSites?.[0] || "bkgalabovo";
  }
  
  return decodedToken;
}
```

**Risk**: MEDIUM - Changes auth token handling
**Mitigation**: Test thoroughly with both sites

---

### P2-4: Consolidate Date Format Handling
**Finding**: Data Contracts - Inconsistent date formats
**Files**: Multiple services
**Root Cause**: Mix of Timestamp, ISO strings, Date objects

**Fix**: 
1. Standardize on ISO 8601 strings in all types
2. Create single utility for Timestamp → ISO conversion
3. Update all converters to use consistent format

**Risk**: MEDIUM - Wide-reaching changes
**Mitigation**: Do incrementally per domain

---

## P3 - TECHNICAL DEBT

These are quality improvements.

### P3-1: Protect Debug Endpoints
**Finding**: FIND-011 (LOW)
**Files**: `src/app/api/debug/route.ts`, `analyze-reservations/route.ts`, `analyze-db/route.ts`
**Root Cause**: Debug endpoints unprotected in production

**Fix Options**:
1. Remove from production builds:
```typescript
// In next.config.js
// Exclude debug routes from production build
```
2. Add admin-only protection:
```typescript
// In each debug route
const user = await ensureAdmin(token);
```
3. Behind feature flag:
```typescript
if (process.env.NODE_ENV === "production" && !process.env.ENABLE_DEBUG) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

**Risk**: LOW - Dev tools only

---

### P3-2: Replace `z.any()` with Specific Types
**Finding**: FIND-012 (LOW)
**Files**: Various Zod schemas
**Root Cause**: Excessive `z.any()` usage

**Fix**: Audit each `z.any()` usage and replace with specific type or `z.unknown()` with validation

**Risk**: LOW - Type improvements only

---

### P3-3: Standardize Error Handling
**Finding**: FIND-013 (LOW)
**Files**: Various service files
**Root Cause**: Inconsistent error handling patterns

**Fix**: Create standard error handling pattern:
```typescript
// Standard pattern
try {
  // operation
} catch (error) {
  console.error("Operation failed:", error);
  // Re-throw with context
  throw new Error(`Operation failed: ${error.message}`);
}
```

**Risk**: LOW - Code quality only

---

## Fix Dependency Graph

```
P0-1 (proxy.ts) ──────────────────────┐
                                       │
P0-2 (email schema) ──────────────────┤
                                       │
P0-3 (member.siteId) ─────────────────┤
       │                              │
       ▼                              ▼
P0-4 (sale.siteId) ──────────────► P1-2 (cron site filter)
       │                              │
       ▼                              ▼
P1-1 (upload site validation) ◄──────┘
       │
       ▼
P1-3 (quiz site filter)
       │
       ▼
P1-4 (admin site context) ◄──────────┐
                                     │
P2-1 (member cache) ◄────────────────┘
       │
       ▼
P2-3 (session siteId)
       │
       ▼
P2-4 (date formats)
       │
       ▼
P3-1, P3-2, P3-3 (quality)
```

---

## Recommended Execution Order

### Week 1 (P0 - Critical)
1. **Day 1**: P0-1 - Fix proxy.ts (5 min, low risk)
2. **Day 1-2**: P0-2 - Email schema (2-4 hours, test all callers)
3. **Day 2-3**: P0-3 - Member siteId (4-8 hours + migration)
4. **Day 3**: P0-4 - Sale siteId (30 min)

### Week 2 (P1 - High)
5. **Day 4-5**: P1-1 - Upload site validation (4-8 hours + path audit)
6. **Day 5**: P1-2 - Cron site filtering (2-4 hours)
7. **Day 6**: P1-3 - Quiz token site filter (1-2 hours)
8. **Day 6-7**: P1-4 - Admin site context (4-8 hours)

### Week 3 (P2 - Medium)
9. **Day 8-9**: P2-1 - Member cache site context (4-8 hours + caller updates)
10. **Day 9**: P2-3 - Session siteId (2-4 hours)
11. **Day 10**: P2-4 - Date formats (8-16 hours, incremental)

### Week 4 (P3 - Quality)
12. **Day 11**: P3-1 - Debug endpoints (1-2 hours)
13. **Day 11**: P3-2 - z.any() cleanup (2-4 hours)
14. **Day 12**: P3-3 - Error handling (4-8 hours)

---

## Risk Mitigation Strategy

| Risk | Mitigation |
|------|------------|
| Migration fails | Test on staging, run in transaction, have rollback plan |
| Breaks existing callers | Add optional fields with defaults, test incrementally |
| Cross-tenant issues | Test with both sites' data simultaneously |
| Auth changes | Test login/logout/protected routes for both sites |
| Cache invalidation | Add cache-busting mechanism, test site switching |

---

## Verification Gates

Each fix must pass:
1. ✅ `npm run typecheck`
2. ✅ `npm run lint`
3. ✅ `npm run test`
4. ✅ `npm run build`
5. ✅ Manual testing of affected functionality
6. ✅ Cross-tenant testing (both bkgalabovo and recoveryzone)

---

## Rollback Plan

If any fix causes issues:
1. Revert specific commit
2. Run full test suite
3. Verify no regressions
4. Re-approach fix with smaller increments

---

*Fix Plan: 2026-08-24*
*Total Fixes: 14 actionable items across P0-P3*
*Estimated Effort: ~60-100 hours*
*Critical Path: P0-1 → P0-2 → P0-3 → P0-4 → P1-1 → P1-2*