/**
 * firebase-admin-backup.ts
 * ========================
 * Втори Firebase Admin SDK инстанс — резервна база данни.
 * Активира се автоматично при RESOURCE_EXHAUSTED от основната.
 *
 * Изисква: FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON в .env.local / Vercel env vars
 */
import * as admin from "firebase-admin";

const BACKUP_APP_NAME = "bkgalabovo-backup";

let backupDb: admin.firestore.Firestore | null = null;
let initAttempted = false;

function initBackupAdmin(): admin.firestore.Firestore | null {
  if (initAttempted) return backupDb;
  initAttempted = true;

  const serviceAccountJson = process.env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn(
      "[backup-db] FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON not set — backup Firestore unavailable"
    );
    return null;
  }

  try {
    // Проверяваме дали вече е инициализирано (hot reload в dev)
    const existing = admin.apps.find((a) => a?.name === BACKUP_APP_NAME);
    const app =
      existing ??
      (() => {
        let raw = serviceAccountJson.trim();
        if (
          (raw.startsWith("'") && raw.endsWith("'")) ||
          (raw.startsWith('"') && raw.endsWith('"'))
        ) {
          raw = raw.slice(1, -1);
        }
        const sa = JSON.parse(raw);
        if (sa.private_key) {
          sa.private_key = sa.private_key.replace(/\\n/g, "\n");
        }
        return admin.initializeApp(
          { credential: admin.credential.cert(sa) },
          BACKUP_APP_NAME
        );
      })();

    backupDb = app.firestore();
    try {
      backupDb.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Ignore if already set
    }
    console.log(
      "[backup-db] ✅ Backup Firestore initialized with service account."
    );
    return backupDb;
  } catch (err) {
    console.error("[backup-db] ❌ Failed to initialize backup Firestore:", err);
    return null;
  }
}

export function getBackupDb(): admin.firestore.Firestore | null {
  return initBackupAdmin();
}

export function isBackupAvailable(): boolean {
  return !!process.env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON;
}
