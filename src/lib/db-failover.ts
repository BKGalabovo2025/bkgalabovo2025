/**
 * db-failover.ts
 * ==============
 * Интелигентен Firestore failover wrapper.
 *
 * При RESOURCE_EXHAUSTED от основната база:
 *   - ЗАПИСИ: автоматично пренасочва към резервна база
 *   - ЧЕТЕНИЯ: първо основна, при грешка → резервна
 *
 * Използване:
 *   import { withFailover } from "@/lib/db-failover";
 *   const result = await withFailover((db) => db.collection("members").add(data));
 */
import * as admin from "firebase-admin";

import { getAdminDb } from "./firebase-admin";
import { getBackupDb, isBackupAvailable } from "./firebase-admin-backup";
import {
  isPrimaryQuotaCurrentlyExhausted,
  isQuotaError,
  markPrimaryQuotaExhausted,
  resetPrimaryQuotaStatus,
} from "./firestore-resilient-proxy";

export type DbFn<T> = (db: admin.firestore.Firestore) => Promise<T>;

/**
 * Изпълнява операция с автоматичен failover.
 *
 * @param fn - функция, получаваща Firestore инстанс
 * @param options.writeOperation - ако true, при quota грешка САМО резервна база се използва
 * @param options.label - лейбъл за логове
 */
export async function withFailover<T>(
  fn: DbFn<T>,
  options: { writeOperation?: boolean; label?: string } = {}
): Promise<T> {
  const { label = "db-failover", writeOperation = false } = options;

  // Ако квотата вече е известна като изчерпана, директно използваме backup
  if (isPrimaryQuotaCurrentlyExhausted()) {
    const backupDb = getBackupDb();
    if (backupDb) {
      return await fn(backupDb);
    }
  }

  try {
    const primaryDb = getAdminDb();
    return await fn(primaryDb);
  } catch (primaryErr) {
    if (!isQuotaError(primaryErr)) {
      // Не е quota грешка — хвърляме нагоре
      throw primaryErr;
    }

    markPrimaryQuotaExhausted();

    // Quota грешка от основна база
    const backupDb = getBackupDb();
    if (!backupDb) {
      console.error(
        "Primary quota exceeded AND no backup DB configured! Add FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON to env vars. Caller:",
        label
      );
      throw primaryErr; // Нямаме резервна — хвърляме оригиналната грешка
    }

    if (writeOperation) {
      console.warn(
        "⚠️ Primary quota exceeded — redirecting WRITE to backup Firestore. Caller:",
        label
      );
    } else {
      console.warn(
        "⚠️ Primary quota exceeded — falling back to backup Firestore for read. Caller:",
        label
      );
    }

    return await fn(backupDb);
  }
}

/**
 * Само четене — опитва основна, при quota пробва резервна.
 * Ако и двете се провалят, хвърля грешка.
 */
export async function readWithFallback<T>(
  fn: DbFn<T>,
  label = "read"
): Promise<T> {
  return withFailover(fn, { writeOperation: false, label });
}

/**
 * Запис — при quota в основната, пише в резервната.
 * Резервната база е "буфер" до нулиране на квотата.
 */
export async function writeWithFallback<T>(
  fn: DbFn<T>,
  label = "write"
): Promise<T> {
  return withFailover(fn, { writeOperation: true, label });
}

/**
 * Синхронизира документ от резервната в основната база.
 * Използва се когато основната квота се нулира.
 */
export async function syncFromBackupToMain(
  collection: string,
  docId: string
): Promise<boolean> {
  const backupDb = getBackupDb();
  if (!backupDb) return false;

  try {
    const backupSnap = await backupDb.collection(collection).doc(docId).get();
    if (!backupSnap.exists) return false;

    const mainDb = getAdminDb();
    await mainDb
      .collection(collection)
      .doc(docId)
      .set(backupSnap.data()!, { merge: true });

    console.log(
      "[sync] ✅ Synced document from backup to main:",
      collection,
      docId
    );
    return true;
  } catch (err) {
    console.error(
      "[sync] ❌ Failed to sync document from backup to main:",
      collection,
      docId,
      err
    );
    return false;
  }
}

export {
  isBackupAvailable,
  isPrimaryQuotaCurrentlyExhausted,
  isQuotaError,
  markPrimaryQuotaExhausted,
  resetPrimaryQuotaStatus,
};
