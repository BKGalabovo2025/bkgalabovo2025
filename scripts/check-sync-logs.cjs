const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const envContent = fs.readFileSync(
  path.join(__dirname, "..", ".env.local"),
  "utf8"
);
const match = envContent.match(/FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON=(.+)/);
if (!match) {
  console.log("ENV не е намерена");
  process.exit(1);
}

let raw = match[1].trim();
if (
  (raw.startsWith("'") && raw.endsWith("'")) ||
  (raw.startsWith('"') && raw.endsWith('"'))
) {
  raw = raw.slice(1, -1);
}
const sa = JSON.parse(raw);
if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");

const app = admin.initializeApp(
  { credential: admin.credential.cert(sa) },
  "log-check"
);
const db = app.firestore();

async function run() {
  const snap = await db
    .collection("system_sync_logs")
    .orderBy("timestamp", "desc")
    .limit(5)
    .get();

  if (snap.empty) {
    console.log("=== НЕ СА НАМЕРЕНИ СИНХРОНИЗАЦИОННИ ЛОГОВЕ ===");
    console.log(
      "Автоматичният cron (/api/cron/sync-backup) не е пускан все още."
    );
    console.log("Ще се пусне утре в 10:00 ч. (Sofia time / 07:00 UTC).");
  } else {
    console.log("=== СИНХРОНИЗАЦИОННИ ЛОГОВЕ ===");
    snap.forEach((doc) => {
      const d = doc.data();
      console.log("Дата:      ", d.timestamp);
      console.log("Статус:    ", d.status);
      console.log("Документи:", d.totalSynced);
      console.log(
        "Квота:     ",
        d.quotaHit ? "⚠️ изчерпана по средата" : "✅ ОК"
      );
      console.log("---");
    });
  }
  await app.delete();
}

run().catch((e) => {
  console.log("Грешка:", e.message);
  process.exit(1);
});
