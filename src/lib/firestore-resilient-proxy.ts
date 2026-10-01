/**
 * firestore-resilient-proxy.ts
 * ============================
 * Transparent failover proxy for Firebase Admin Firestore.
 * Intercepts Firestore database, collection, document, and query operations.
 * If the primary Firestore database throws a quota / RESOURCE_EXHAUSTED error:
 *   1. Trips the circuit breaker to route subsequent calls to the backup DB.
 *   2. Automatically replays the failed operation on the backup Firestore database.
 *   3. Returns the backup result seamlessly to the caller without crashing.
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

export function isPrimaryQuotaCurrentlyExhausted(): boolean {
  if (!isPrimaryQuotaExhausted) return false;
  if (
    quotaExhaustedTimestamp &&
    Date.now() - quotaExhaustedTimestamp > CIRCUIT_RESET_MS
  ) {
    console.log(
      `[firestore-failover] ⏳ Circuit breaker cooldown elapsed (${CIRCUIT_RESET_MS / 60000}m). Probing primary DB.`
    );
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
    const fn = (current as Record<string, unknown>)?.[step.method];
    if (typeof fn === "function") {
      let args = step.args;
      if (step.method === "doc" && args.length === 0 && step.docIdHint) {
        args = [step.docIdHint];
      }
      current = (fn as AnyFn)(...args);
    } else {
      throw new Error(
        `[firestore-failover] Method ${step.method} not found during backup replay.`
      );
    }
  }
  return current;
}

async function executeOnBackup(
  backupDb: admin.firestore.Firestore,
  steps: ChainStep[],
  prop: string,
  args: unknown[]
): Promise<unknown> {
  const backupTarget = replayChain(backupDb, steps) as Record<string, unknown>;
  const fn = backupTarget[prop];
  if (typeof fn === "function") {
    return await (fn as AnyFn)(...args);
  }
  return undefined;
}

async function handleExecutionMethod(
  origFn: AnyFn,
  obj: object,
  steps: ChainStep[],
  prop: string,
  args: unknown[],
  getBackupDb: () => admin.firestore.Firestore | null
): Promise<unknown> {
  if (isPrimaryQuotaCurrentlyExhausted()) {
    const backupDb = getBackupDb();
    if (backupDb) {
      return await executeOnBackup(backupDb, steps, prop, args);
    }
  }

  try {
    return await origFn.apply(obj, args);
  } catch (err) {
    if (isQuotaError(err)) {
      markPrimaryQuotaExhausted();
      const backupDb = getBackupDb();
      if (!backupDb) {
        console.error(
          `[firestore-failover] ❌ Primary Firestore quota exceeded on ${steps
            .map((s) => s.method)
            .join(".")}.${prop}(), but no backup DB is available!`
        );
        throw err;
      }

      console.warn(
        `[firestore-failover] 🔀 Primary quota exceeded. Replaying ${steps
          .map((s) => s.method)
          .join(".")}.${prop}() on backup Firestore...`
      );
      return await executeOnBackup(backupDb, steps, prop, args);
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
}

function replayBatchOps(
  backupDb: admin.firestore.Firestore,
  ops: RecordedBatchOp[]
): Promise<admin.firestore.WriteResult[]> {
  const backupBatch = backupDb.batch();
  for (const op of ops) {
    const backupRef = backupDb.doc(op.path);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (backupBatch as any)[op.type](backupRef, ...op.args);
  }
  return backupBatch.commit();
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
      ops.push({ type: "update", path: documentRef.path, args });
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
      if (isPrimaryQuotaCurrentlyExhausted()) {
        const backupDb = getBackupDb();
        if (backupDb) {
          return await replayBatchOps(backupDb, ops);
        }
      }

      try {
        return await primaryBatch.commit();
      } catch (err) {
        if (isQuotaError(err)) {
          markPrimaryQuotaExhausted();
          const backupDb = getBackupDb();
          if (!backupDb) throw err;
          console.warn(
            "[firestore-failover] 🔀 Batch commit exceeded quota. Replaying on backup Firestore..."
          );
          return await replayBatchOps(backupDb, ops);
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

async function handleRunTransaction<T>(
  primaryDb: admin.firestore.Firestore,
  getBackupDb: () => admin.firestore.Firestore | null,
  updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>,
  transactionOptions?: Parameters<
    admin.firestore.Firestore["runTransaction"]
  >[1]
): Promise<T> {
  const activeDb = getActiveFirestore(primaryDb, getBackupDb);
  try {
    return await activeDb.runTransaction(updateFunction, transactionOptions);
  } catch (err) {
    if (isQuotaError(err)) {
      markPrimaryQuotaExhausted();
      const backupDb = getBackupDb();
      if (!backupDb) throw err;
      console.warn(
        "[firestore-failover] 🔀 runTransaction exceeded quota. Retrying on backup Firestore..."
      );
      return await backupDb.runTransaction(updateFunction, transactionOptions);
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
