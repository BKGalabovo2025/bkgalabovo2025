/**
 * Safe Disaster Recovery Restore Script for bkgalabovo2025.
 * Usage:
 *   npx tsx scripts/restore-backup.ts --backup-id=<id> [--dry-run]
 *   npx tsx scripts/restore-backup.ts --backup-id=<id> --confirm
 */
import * as fs from "node:fs";
import * as path from "node:path";

import admin from "firebase-admin";

function loadEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {};
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return env;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

async function main() {
  const args = process.argv.slice(2);
  const backupIdArg = args.find((a) => a.startsWith("--backup-id="));
  const backupId = backupIdArg ? backupIdArg.split("=")[1] : "";
  const isConfirmed = args.includes("--confirm");
  const isDryRun = !isConfirmed || args.includes("--dry-run");

  if (!backupId) {
    console.error(
      "Usage: npx tsx scripts/restore-backup.ts --backup-id=<id> [--dry-run | --confirm]"
    );
    process.exit(1);
  }

  const localEnv = loadEnvLocal();
  const rawSa =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    localEnv.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawSa) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON in environment.");
    process.exit(1);
  }

  const sa = JSON.parse(rawSa);
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");

  const app = admin.initializeApp(
    { credential: admin.credential.cert(sa) },
    "restore-cli"
  );
  const db = app.firestore();

  const backupRef = db.collection("system_backups").doc(backupId);
  const backupMeta = await backupRef.get();
  if (!backupMeta.exists) {
    console.error(`Backup "${backupId}" not found in system_backups.`);
    process.exit(1);
  }

  const subColsSnap = await backupRef.collection("collections").get();
  const collectionsMap: Record<string, Array<Record<string, unknown>>> = {};

  for (const docSnap of subColsSnap.docs) {
    const d = docSnap.data();
    const targetCol =
      typeof d.collection === "string"
        ? d.collection
        : docSnap.id.replace(/__chunk_\d+$/, "");
    if (targetCol === "uploaded_files") continue; // metadata only
    const items = Array.isArray(d.data)
      ? (d.data as Array<Record<string, unknown>>)
      : [];
    if (!collectionsMap[targetCol]) collectionsMap[targetCol] = [];
    collectionsMap[targetCol].push(...items);
  }

  console.log(
    `Backup ${backupId} (${backupMeta.data()?.siteId}) — mode: ${isDryRun ? "DRY-RUN" : "LIVE RESTORE"}`
  );

  for (const [colName, docs] of Object.entries(collectionsMap)) {
    console.log(`  - ${colName}: ${docs.length} documents`);
    if (isDryRun) continue;

    for (let i = 0; i < docs.length; i += 400) {
      const chunk = docs.slice(i, i + 400);
      const batch = db.batch();
      for (const item of chunk) {
        const { _id, ...payload } = item;
        if (typeof _id !== "string" || !_id) continue;
        batch.set(db.collection(colName).doc(_id), payload, { merge: true });
      }
      await batch.commit();
    }
  }

  console.log(
    isDryRun
      ? "Dry-run complete. Re-run with --confirm to execute restore."
      : "Restore completed successfully."
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Restore failed:", err);
  process.exit(1);
});
