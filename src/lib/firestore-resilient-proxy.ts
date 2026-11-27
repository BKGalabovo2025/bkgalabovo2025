/**
 * firestore-resilient-proxy.ts
 * ============================
 * Transparent failover proxy for Firebase Admin Firestore.
 * Intercepts Firestore database, collection, document, and query operations.
 * If the primary Firestore database throws a quota / RESOURCE_EXHAUSTED error:
 *   1. Trips the circuit breaker to route subsequent calls to the backup DB.
 *   2. Automatically replays the failed operation on the backup Firestore database.
 *   3. If the query requires an index not yet built (FAILED_PRECONDITION),
 *      performs in-memory sorting/filtering fallback so user requests never crash.
 *   4. Returns the backup result seamlessly to the caller.
 */

import * as admin from "firebase-admin";

const CIRCUIT_RESET_MS = 10 * 60 * 1000; // 10 minutes

let isPrimaryQuotaExhausted = false;
let quotaExhaustedTimestamp: number | null = null;

type AnyFn = (...args: unknown[]) => unknown;

/**
 * Checks whether an error is due to Google Cloud / Firestore quota exhaustion.
 */
export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Quota exceeded") ||
    msg.includes("quota exceeded") ||
    msg.includes("Resource has been exhausted") ||
    msg.includes("Quota limit reached") ||
    msg.includes("Quota exceeded for quota metric")
  ) {
    return true;
  }
  if (typeof err === "object" && err !== null) {
    const code = (err as Record<string, unknown>).code;
    if (
      code === 8 ||
      code === "8" ||
      code === "RESOURCE_EXHAUSTED" ||
      code === "resource-exhausted"
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether an error is due to a missing Firestore composite index.
 */
export function isIndexRequiredError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("requires an index") ||
    msg.includes("The query requires an index") ||
    (typeof err === "object" &&
      err !== null &&
      (err as Record<string, unknown>).code === 9 &&
      msg.includes("index"))
  );
}

/**
 * Extracts the Firebase Console index creation URL from the error message, if present.
 */
export function extractIndexUrl(err: unknown): string | null {
  if (!err) return null;
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/https:\/\/console\.firebase\.google\.com[^\s\)]+/);
  return match ? match[0] : null;
}

export function markPrimaryQuotaExhausted(): void {
  isPrimaryQuotaExhausted = true;
  quotaExhaustedTimestamp = Date.now();
  console.warn(
    `[firestore-failover] 🚨 Primary Firestore quota EXHAUSTED at ${new Date().toISOString()}. Switching operations to backup DB.`
  );
}

export function resetPrimaryQuotaStatus(): void {
  isPrimaryQuotaExhausted = false;
  quotaExhaustedTimestamp = null;
  console.log(
    `[firestore-failover] 🔄 Primary Firestore quota status reset. Resuming primary DB.`
  );
}

let cachedPrimaryDb: admin.firestore.Firestore | null = null;
let isProbingPrimary = false;

async function probePrimaryDbInBackground(
  primaryDb: admin.firestore.Firestore
) {
  if (isProbingPrimary) return;
  isProbingPrimary = true;
  try {
    await primaryDb.collection("members").limit(1).get();
    console.log(
      `[firestore-failover] 🟢 Primary Firestore probe SUCCEEDED! Quota is restored. Resuming primary DB.`
    );
    resetPrimaryQuotaStatus();
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(
        `[firestore-failover] ⏳ Primary Firestore probe still exhausted. Staying on backup DB.`
      );
      quotaExhaustedTimestamp = Date.now();
    }
  } finally {
    isProbingPrimary = false;
  }
}

export function isPrimaryQuotaCurrentlyExhausted(): boolean {
  if (!isPrimaryQuotaExhausted) return false;
  if (
    quotaExhaustedTimestamp &&
    Date.now() - quotaExhaustedTimestamp > CIRCUIT_RESET_MS
  ) {
    if (cachedPrimaryDb) {
      console.log(
        `[firestore-failover] ⏳ Circuit breaker cooldown elapsed (${CIRCUIT_RESET_MS / 60000}m). Launching background probe of primary DB...`
      );
      probePrimaryDbInBackground(cachedPrimaryDb).catch(() => {});
      return true;
    }
    isPrimaryQuotaExhausted = false;
    quotaExhaustedTimestamp = null;
    return false;
  }
  return true;
}

interface ChainStep {
  method: string;
  args: unknown[];
  docIdHint?: string;
}

interface CacheEntry {
  result: unknown;
  timestamp: number;
}

const memoryReadCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh TTL

export function resetMemoryCache(): void {
  memoryReadCache.clear();
}

function getCacheKey(steps: ChainStep[], args: unknown[]): string {
  try {
    return `${steps.map((s) => `${s.method}(${JSON.stringify(s.args)})`).join(".")}#${JSON.stringify(args)}`;
  } catch {
    return "";
  }
}

function setCache(cacheKey: string, result: unknown): void {
  if (!cacheKey) return;
  if (memoryReadCache.size > 500) {
    const firstKey = memoryReadCache.keys().next().value;
    if (firstKey) memoryReadCache.delete(firstKey);
  }
  memoryReadCache.set(cacheKey, { result, timestamp: Date.now() });
}

function invalidateCacheForCollection(collectionName?: string): void {
  if (!collectionName) {
    memoryReadCache.clear();
    return;
  }
  const colNeedle = `collection(["${collectionName}"])`;
  const groupNeedle = `collectionGroup(["${collectionName}"])`;
  const docNeedle = `doc(["${collectionName}/`;
  for (const key of memoryReadCache.keys()) {
    if (
      key.includes(colNeedle) ||
      key.includes(groupNeedle) ||
      key.includes(docNeedle)
    ) {
      memoryReadCache.delete(key);
    }
  }
}

function invalidateCacheForSteps(steps: ChainStep[]): void {
  const colStep = steps.find(
    (s) => s.method === "collection" || s.method === "collectionGroup"
  );
  let colName =
    colStep && typeof colStep.args[0] === "string"
      ? colStep.args[0]
      : undefined;
  if (!colName) {
    const docStep = steps.find((s) => s.method === "doc");
    if (docStep && typeof docStep.args[0] === "string") {
      colName = docStep.args[0].split("/")[0] || undefined;
    }
  }
  invalidateCacheForCollection(colName);
}

function getSafeFallbackForGet(steps: ChainStep[], cacheKey: string): unknown {
  // 1. Първи приоритет: връщане на кеширани данни (дори да са леко остарели), за да се запази потребителското изживяване
  const cached = memoryReadCache.get(cacheKey);
  if (cached && cached.result) {
    const ageSec = Math.round((Date.now() - cached.timestamp) / 1000);
    console.warn(
      `[firestore-failover] 🛡️ Serving cached snapshot for ${cacheKey} (възраст: ${ageSec}s) поради надвишена Firestore квота.`
    );
    return cached.result;
  }

  // 2. Втори приоритет: ако е единичен документ, връщане на безопасен mock DocumentSnapshot
  const isDoc = steps.length > 0 && steps[steps.length - 1].method === "doc";

  if (isDoc) {
    const docId = String(steps[steps.length - 1].args[0] || "unknown-id");
    console.warn(
      `[firestore-failover] 🛡️ Квотата е изчерпана за doc("${docId}"). Връщане на безопасен празен DocumentSnapshot.`
    );
    return {
      id: docId,
      exists: false,
      data: () => undefined,
      get: () => undefined,
      ref: {
        id: docId,
        path: steps
          .map((s) => s.args[0])
          .filter(Boolean)
          .join("/"),
      },
    };
  }

  // 3. Трети приоритет: за колекция или филтрирана заявка - връщане на безопасен mock QuerySnapshot
  console.warn(
    `[firestore-failover] 🛡️ Квотата е изчерпана за заявка към колекция. Връщане на безопасен празен QuerySnapshot.`
  );
  return {
    empty: true,
    size: 0,
    docs: [],
    forEach: () => {},
    docChanges: () => [],
    query: {},
  };
}

// Chainable query/reference builder methods
const BUILDER_METHODS = new Set([
  "collection",
  "collectionGroup",
  "doc",
  "where",
  "orderBy",
  "limit",
  "limitToLast",
  "offset",
  "startAt",
  "startAfter",
  "endAt",
  "endBefore",
  "select",
  "withConverter",
  "count",
]);

// Asynchronous execution methods that make network requests
const EXECUTION_METHODS = new Set([
  "get",
  "set",
  "update",
  "delete",
  "create",
  "add",
  "listCollections",
  "listDocuments",
]);

/**
 * Replays a sequence of builder steps starting from a base Firestore instance.
 */
function replayChain(
  baseDb: admin.firestore.Firestore,
  steps: ChainStep[]
): unknown {
  let current: unknown = baseDb;
  for (const step of steps) {
    const targetObj = current as Record<string, unknown>;
    const fn = targetObj?.[step.method];
    if (typeof fn === "function") {
      let args = step.args;
      if (step.method === "doc" && args.length === 0 && step.docIdHint) {
        args = [step.docIdHint];
      }
      current = Reflect.apply(fn as AnyFn, targetObj, args);
    } else {
      throw new Error(
        `[firestore-failover] Method ${step.method} not found during backup replay.`
      );
    }
  }
  return current;
}

interface OrderBySpec {
  field: string;
  dir: "asc" | "desc";
}

function sortDocsInMemory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  docs: any[],
  orderBys: OrderBySpec[],
  limit?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const sorted = [...docs].sort((a, b) => {
    const dataA = typeof a.data === "function" ? a.data() : a;
    const dataB = typeof b.data === "function" ? b.data() : b;
    for (const { field, dir } of orderBys) {
      const valA = dataA?.[field];
      const valB = dataB?.[field];
      if (valA === valB) continue;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      const cmp = valA > valB ? 1 : -1;
      return dir === "desc" ? -cmp : cmp;
    }
    return 0;
  });

  return typeof limit === "number" && limit > 0
    ? sorted.slice(0, limit)
    : sorted;
}

function wrapInMemorySnapshot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawSnapshot: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sortedDocs: any[]
): unknown {
  return new Proxy(rawSnapshot, {
    get(target, prop, receiver) {
      if (prop === "docs") return sortedDocs;
      if (prop === "empty") return sortedDocs.length === 0;
      if (prop === "size") return sortedDocs.length;
      if (prop === "forEach") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (cb: (doc: any, index: number) => void) =>
          sortedDocs.forEach(cb);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

/**
 * Attempts an in-memory sort/limit fallback when a query throws a missing index error.
 */
async function tryInMemoryIndexFallback(
  db: admin.firestore.Firestore,
  steps: ChainStep[],
  originalErr: unknown
): Promise<unknown | null> {
  const url = extractIndexUrl(originalErr);
  console.warn(
    `[firestore-failover] ⚠️ Missing composite index detected! Applying in-memory sort fallback.\nIndex URL: ${url ?? "N/A"}`
  );

  const orderBys: OrderBySpec[] = steps
    .filter((s) => s.method === "orderBy")
    .map((s) => ({
      field: String(s.args[0]),
      dir: (String(s.args[1] || "asc").toLowerCase() === "desc"
        ? "desc"
        : "asc") as "asc" | "desc",
    }));

  const limitStep = steps.find((s) => s.method === "limit");
  const limit = limitStep ? (limitStep.args[0] as number) : undefined;

  // Filter out orderBy and limit so Firestore will execute without composite index,
  // and apply a safety cap of 500 documents when .limit() is supported.
  const relaxedSteps = steps.filter(
    (s) => s.method !== "orderBy" && s.method !== "limit"
  );

  try {
    let target = replayChain(db, relaxedSteps) as Record<string, unknown>;
    if (typeof target.limit === "function") {
      target = (target.limit as (n: number) => Record<string, unknown>)(500);
    }
    const fn = target.get;
    if (typeof fn !== "function") return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSnapshot = (await Reflect.apply(fn as AnyFn, target, [])) as any;
    if (!rawSnapshot || !Array.isArray(rawSnapshot.docs)) {
      return rawSnapshot;
    }

    const sortedDocs = sortDocsInMemory(rawSnapshot.docs, orderBys, limit);
    return wrapInMemorySnapshot(rawSnapshot, sortedDocs);
  } catch (fallbackErr) {
    console.error(
      "[firestore-failover] In-memory index fallback failed:",
      fallbackErr
    );
    return null;
  }
}

function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; message?: unknown };
  return (
    e.code === 5 ||
    e.code === "not-found" ||
    (typeof e.message === "string" && e.message.includes("NOT_FOUND"))
  );
}

async function executeOnBackup(
  backupDb: admin.firestore.Firestore,
  steps: ChainStep[],
  prop: string,
  args: unknown[],
  primaryTarget?: object
): Promise<unknown> {
  try {
    const backupTarget = replayChain(backupDb, steps) as Record<
      string,
      unknown
    >;
    const fn = backupTarget[prop];
    if (typeof fn === "function") {
      return await Reflect.apply(fn as AnyFn, backupTarget, args);
    }
    return undefined;
  } catch (err) {
    if (prop === "get" && isIndexRequiredError(err)) {
      const fallbackSnap = await tryInMemoryIndexFallback(backupDb, steps, err);
      if (fallbackSnap) return fallbackSnap;
    }
    if (prop === "update" && isNotFoundError(err)) {
      const backupTarget = replayChain(backupDb, steps) as {
        set?: (data: unknown, opts?: unknown) => Promise<unknown>;
      };
      if (typeof backupTarget?.set === "function") {
        // Self-heal: copy full doc from primary if available, else upsert update payload
        const primaryDoc = primaryTarget as
          | { get?: () => Promise<{ exists?: boolean; data?: () => unknown }> }
          | undefined;
        if (typeof primaryDoc?.get === "function") {
          try {
            const snap = await primaryDoc.get();
            const docData =
              snap?.exists && typeof snap.data === "function"
                ? snap.data()
                : undefined;
            if (docData) {
              return await backupTarget.set(docData, { merge: true });
            }
          } catch {
            // Fall through to payload upsert
          }
        }
        if (args.length === 1 && args[0] && typeof args[0] === "object") {
          return await backupTarget.set(args[0], { merge: true });
        }
      }
    }
    throw err;
  }
}

async function handleQuotaExhaustionOnExecution(
  err: unknown,
  steps: ChainStep[],
  prop: string,
  args: unknown[],
  getBackupDb: () => admin.firestore.Firestore | null,
  cacheKey: string
): Promise<unknown> {
  markPrimaryQuotaExhausted();
  const backupDb = getBackupDb();
  if (!backupDb) {
    console.error(
      `[firestore-failover] ❌ Primary Firestore quota exceeded on ${steps
        .map((s) => s.method)
        .join(".")}.${prop}(), but no backup DB is available!`
    );
    if (prop === "get") {
      return getSafeFallbackForGet(steps, cacheKey);
    }
    throw err;
  }

  console.warn(
    `[firestore-failover] 🔀 Primary quota exceeded. Replaying ${steps
      .map((s) => s.method)
      .join(".")}.${prop}() on backup Firestore...`
  );
  try {
    const backupResult = await executeOnBackup(backupDb, steps, prop, args);
    if (prop === "get" && backupResult) {
      setCache(cacheKey, backupResult);
    } else if (WRITE_METHODS.has(prop)) {
      invalidateCacheForSteps(steps);
    }
    return backupResult;
  } catch (backupErr) {
    if (isQuotaError(backupErr)) {
      console.warn(
        `[firestore-failover] 🚨 Both Primary AND Backup Firestore quotas exhausted on ${steps
          .map((s) => s.method)
          .join(".")}.${prop}(). Providing safe fallback snapshot.`
      );
      if (prop === "get") {
        return getSafeFallbackForGet(steps, cacheKey);
      }
    }
    throw backupErr;
  }
}

async function handleIndexErrorOnExecution(
  err: unknown,
  obj: object,
  steps: ChainStep[],
  prop: string
): Promise<unknown | null> {
  if (prop !== "get" || !isIndexRequiredError(err)) {
    return null;
  }
  const baseDb = (obj as Record<string, unknown>).firestore as
    admin.firestore.Firestore | undefined;
  if (!baseDb) return null;
  return await tryInMemoryIndexFallback(baseDb, steps, err);
}

const WRITE_METHODS = new Set(["set", "update", "delete", "create", "add"]);

async function handleExecutionMethod(
  origFn: AnyFn,
  obj: object,
  steps: ChainStep[],
  prop: string,
  args: unknown[],
  getBackupDb: () => admin.firestore.Firestore | null
): Promise<unknown> {
  const cacheKey = prop === "get" ? getCacheKey(steps, args) : "";

  if (isPrimaryQuotaCurrentlyExhausted()) {
    const cached = memoryReadCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }

    const backupDb = getBackupDb();
    if (backupDb) {
      try {
        const backupResult = await executeOnBackup(backupDb, steps, prop, args);
        if (prop === "get" && backupResult) {
          setCache(cacheKey, backupResult);
        } else if (WRITE_METHODS.has(prop)) {
          invalidateCacheForSteps(steps);
        }
        return backupResult;
      } catch (backupErr) {
        if (isQuotaError(backupErr)) {
          console.warn(
            `[firestore-failover] 🚨 Backup Firestore quota ALSO exhausted on ${steps
              .map((s) => s.method)
              .join(".")}.${prop}(). Providing safe fallback snapshot.`
          );
          if (prop === "get") {
            return getSafeFallbackForGet(steps, cacheKey);
          }
        }
        throw backupErr;
      }
    } else if (prop === "get") {
      return getSafeFallbackForGet(steps, cacheKey);
    }
  }

  try {
    const primaryResult = await origFn.apply(obj, args);

    if (prop === "get" && primaryResult) {
      setCache(cacheKey, primaryResult);
    }

    // Asynchronous dual-write replication: keep backup DB in sync with primary
    if (WRITE_METHODS.has(prop)) {
      invalidateCacheForSteps(steps);
      const backupDb = getBackupDb();
      if (backupDb) {
        executeOnBackup(backupDb, steps, prop, args, obj).catch((repErr) => {
          console.warn(
            `[firestore-replication] ⚠️ Dual-write replication of ${prop}() to backup DB failed:`,
            repErr instanceof Error ? repErr.message : String(repErr)
          );
        });
      }
    }

    return primaryResult;
  } catch (err) {
    if (isQuotaError(err)) {
      return await handleQuotaExhaustionOnExecution(
        err,
        steps,
        prop,
        args,
        getBackupDb,
        cacheKey
      );
    }

    const indexFallback = await handleIndexErrorOnExecution(
      err,
      obj,
      steps,
      prop
    );
    if (indexFallback) {
      return indexFallback;
    }

    throw err;
  }
}

/**
 * Creates a proxy around a DocumentReference, CollectionReference, or Query.
 */
function wrapReferenceOrQuery<T extends object>(
  target: T,
  steps: ChainStep[],
  getBackupDb: () => admin.firestore.Firestore | null
): T {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (prop === "then") {
        return undefined;
      }

      const origVal = Reflect.get(obj, prop, receiver);

      if (typeof prop === "string" && BUILDER_METHODS.has(prop)) {
        return (...args: unknown[]) => {
          const result = (origVal as AnyFn).apply(obj, args);
          const nextStep: ChainStep = { method: prop, args };
          if (
            prop === "doc" &&
            args.length === 0 &&
            result &&
            typeof (result as { id?: unknown }).id === "string"
          ) {
            nextStep.docIdHint = (result as { id: string }).id;
          }
          if (result && typeof result === "object") {
            return wrapReferenceOrQuery(
              result,
              [...steps, nextStep],
              getBackupDb
            );
          }
          return result;
        };
      }

      if (typeof prop === "string" && EXECUTION_METHODS.has(prop)) {
        return async (...args: unknown[]) =>
          handleExecutionMethod(
            origVal as AnyFn,
            obj,
            steps,
            prop,
            args,
            getBackupDb
          );
      }

      if (typeof origVal === "function") {
        return origVal.bind(obj);
      }

      return origVal;
    },
  });
}

interface RecordedBatchOp {
  type: "set" | "update" | "delete";
  path: string;
  args: unknown[];
  primaryRef?: admin.firestore.DocumentReference;
}

async function replayBatchOps(
  backupDb: admin.firestore.Firestore,
  ops: RecordedBatchOp[]
): Promise<admin.firestore.WriteResult[]> {
  const backupBatch = backupDb.batch();
  for (const op of ops) {
    const backupRef = backupDb.doc(op.path);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (backupBatch as any)[op.type](backupRef, ...op.args);
  }
  try {
    return await backupBatch.commit();
  } catch (err) {
    if (!isNotFoundError(err)) throw err;
    // Self-heal missing documents in backup during batch update()
    const healBatch = backupDb.batch();
    for (const op of ops) {
      const backupRef = backupDb.doc(op.path);
      if (op.type === "update") {
        let healed = false;
        if (op.primaryRef && typeof op.primaryRef.get === "function") {
          try {
            const snap = await op.primaryRef.get();
            if (snap?.exists && snap.data()) {
              healBatch.set(backupRef, snap.data()!, { merge: true });
              healed = true;
            }
          } catch {
            // Fallback below
          }
        }
        if (
          !healed &&
          op.args.length === 1 &&
          op.args[0] &&
          typeof op.args[0] === "object"
        ) {
          healBatch.set(backupRef, op.args[0] as admin.firestore.DocumentData, {
            merge: true,
          });
        } else if (!healed) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (healBatch as any).update(backupRef, ...op.args);
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (healBatch as any)[op.type](backupRef, ...op.args);
      }
    }
    return await healBatch.commit();
  }
}

/**
 * Creates a resilient WriteBatch wrapper that records operations
 * and replays them on backup if primary commit() fails with quota exceeded.
 */
function wrapWriteBatch(
  primaryBatch: admin.firestore.WriteBatch,
  getBackupDb: () => admin.firestore.Firestore | null
): admin.firestore.WriteBatch {
  const ops: RecordedBatchOp[] = [];

  const batchProxy = {
    set(
      documentRef: admin.firestore.DocumentReference,
      data: unknown,
      options?: unknown
    ) {
      ops.push({
        type: "set",
        path: documentRef.path,
        args: options !== undefined ? [data, options] : [data],
      });
      return primaryBatch.set(
        documentRef,
        data as admin.firestore.DocumentData,
        options as admin.firestore.SetOptions
      );
    },
    update(documentRef: admin.firestore.DocumentReference, ...args: unknown[]) {
      ops.push({
        type: "update",
        path: documentRef.path,
        args,
        primaryRef: documentRef,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (primaryBatch.update as any)(documentRef, ...args);
    },
    delete(
      documentRef: admin.firestore.DocumentReference,
      precondition?: unknown
    ) {
      ops.push({
        type: "delete",
        path: documentRef.path,
        args: precondition !== undefined ? [precondition] : [],
      });
      return primaryBatch.delete(
        documentRef,
        precondition as admin.firestore.Precondition
      );
    },
    async commit(): Promise<admin.firestore.WriteResult[]> {
      const invalidateTouchedCollections = () =>
        invalidateCacheForBatchOps(ops);

      if (isPrimaryQuotaCurrentlyExhausted()) {
        const backupDb = getBackupDb();
        if (backupDb) {
          const res = await replayBatchOps(backupDb, ops);
          invalidateTouchedCollections();
          return res;
        }
      }

      try {
        const result = await primaryBatch.commit();
        invalidateTouchedCollections();
        const backupDb = getBackupDb();
        if (backupDb) {
          replayBatchOps(backupDb, ops).catch((repErr) => {
            console.warn(
              "[firestore-replication] ⚠️ Dual-write batch replication to backup DB failed:",
              repErr instanceof Error ? repErr.message : String(repErr)
            );
          });
        }
        return result;
      } catch (err) {
        if (isQuotaError(err)) {
          markPrimaryQuotaExhausted();
          const backupDb = getBackupDb();
          if (!backupDb) throw err;
          console.warn(
            "[firestore-failover] 🔀 Batch commit exceeded quota. Replaying on backup Firestore..."
          );
          const res = await replayBatchOps(backupDb, ops);
          invalidateTouchedCollections();
          return res;
        }
        throw err;
      }
    },
  };

  return batchProxy as unknown as admin.firestore.WriteBatch;
}

function getActiveFirestore(
  primaryDb: admin.firestore.Firestore,
  getBackupDb: () => admin.firestore.Firestore | null
): admin.firestore.Firestore {
  if (isPrimaryQuotaCurrentlyExhausted()) {
    const backupDb = getBackupDb();
    if (backupDb) return backupDb;
  }
  return primaryDb;
}

function invalidateCacheForBatchOps(ops: RecordedBatchOp[]): void {
  const cols = new Set(ops.map((o) => o.path.split("/")[0]).filter(Boolean));
  if (cols.size === 0) {
    memoryReadCache.clear();
  } else {
    cols.forEach((c) => invalidateCacheForCollection(c));
  }
}

async function handleRunTransaction<T>(
  primaryDb: admin.firestore.Firestore,
  getBackupDb: () => admin.firestore.Firestore | null,
  updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>,
  transactionOptions?: Parameters<
    admin.firestore.Firestore["runTransaction"]
  >[1]
): Promise<T> {
  const activeDb = getActiveFirestore(primaryDb, getBackupDb);
  let recordedOps: RecordedBatchOp[] = [];

  const wrappedUpdateFn = (tx: admin.firestore.Transaction) => {
    recordedOps = [];
    const txProxy = new Proxy(tx, {
      get(target, prop, receiver) {
        const orig = Reflect.get(target, prop, receiver);
        if (prop === "set" && typeof orig === "function") {
          return (
            docRef: admin.firestore.DocumentReference,
            data: unknown,
            options?: unknown
          ) => {
            recordedOps.push({
              type: "set",
              path: docRef.path,
              args: options !== undefined ? [data, options] : [data],
              primaryRef: docRef,
            });
            return orig.call(target, docRef, data, options);
          };
        }
        if (prop === "update" && typeof orig === "function") {
          return (
            docRef: admin.firestore.DocumentReference,
            ...args: unknown[]
          ) => {
            recordedOps.push({
              type: "update",
              path: docRef.path,
              args,
              primaryRef: docRef,
            });
            return orig.call(target, docRef, ...args);
          };
        }
        if (prop === "delete" && typeof orig === "function") {
          return (
            docRef: admin.firestore.DocumentReference,
            precondition?: unknown
          ) => {
            recordedOps.push({
              type: "delete",
              path: docRef.path,
              args: precondition !== undefined ? [precondition] : [],
              primaryRef: docRef,
            });
            return orig.call(target, docRef, precondition);
          };
        }
        return typeof orig === "function" ? orig.bind(target) : orig;
      },
    });
    return updateFunction(txProxy);
  };

  try {
    const res = await activeDb.runTransaction(
      wrappedUpdateFn,
      transactionOptions
    );
    invalidateCacheForBatchOps(recordedOps);
    if (activeDb === primaryDb && recordedOps.length > 0) {
      const backupDb = getBackupDb();
      if (backupDb) {
        replayBatchOps(backupDb, recordedOps).catch((repErr) => {
          console.warn(
            "[firestore-replication] ⚠️ Dual-write transaction replication to backup DB failed:",
            repErr instanceof Error ? repErr.message : String(repErr)
          );
        });
      }
    }
    return res;
  } catch (err) {
    if (isQuotaError(err)) {
      markPrimaryQuotaExhausted();
      const backupDb = getBackupDb();
      if (!backupDb) throw err;
      console.warn(
        "[firestore-failover] 🔀 runTransaction exceeded quota. Retrying on backup Firestore..."
      );
      const res = await backupDb.runTransaction(
        updateFunction,
        transactionOptions
      );
      memoryReadCache.clear();
      return res;
    }
    throw err;
  }
}

/**
 * Creates the Resilient Firestore proxy over the primary Firestore instance.
 */
export function createResilientFirestoreProxy(
  primaryDb: admin.firestore.Firestore,
  getBackupDb: () => admin.firestore.Firestore | null
): admin.firestore.Firestore {
  cachedPrimaryDb = primaryDb;
  return new Proxy(primaryDb, {
    get(target, prop, receiver) {
      if (prop === "then") {
        return undefined;
      }

      if (prop === "collection") {
        return (collectionPath: string) => {
          const db = getActiveFirestore(target, getBackupDb);
          return wrapReferenceOrQuery(
            db.collection(collectionPath),
            [{ method: "collection", args: [collectionPath] }],
            getBackupDb
          );
        };
      }

      if (prop === "doc") {
        return (documentPath: string) => {
          const db = getActiveFirestore(target, getBackupDb);
          return wrapReferenceOrQuery(
            db.doc(documentPath),
            [{ method: "doc", args: [documentPath] }],
            getBackupDb
          );
        };
      }

      if (prop === "collectionGroup") {
        return (collectionId: string) => {
          const db = getActiveFirestore(target, getBackupDb);
          return wrapReferenceOrQuery(
            db.collectionGroup(collectionId),
            [{ method: "collectionGroup", args: [collectionId] }],
            getBackupDb
          );
        };
      }

      if (prop === "batch") {
        return () =>
          wrapWriteBatch(
            getActiveFirestore(target, getBackupDb).batch(),
            getBackupDb
          );
      }

      if (prop === "runTransaction") {
        return <T>(
          updateFunction: (
            transaction: admin.firestore.Transaction
          ) => Promise<T>,
          transactionOptions?: Parameters<
            admin.firestore.Firestore["runTransaction"]
          >[1]
        ) =>
          handleRunTransaction(
            target,
            getBackupDb,
            updateFunction,
            transactionOptions
          );
      }

      const origVal = Reflect.get(target, prop, receiver);
      if (typeof origVal === "function") {
        return origVal.bind(target);
      }
      return origVal;
    },
  });
}
