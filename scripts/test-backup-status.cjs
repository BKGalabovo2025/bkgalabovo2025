const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const envContent = fs.readFileSync(
  path.join(__dirname, "..", ".env.local"),
  "utf8"
);
const match = envContent.match(/FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON=(.+)/);
if (!match) {
  console.log("No backup service account found");
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
  "backup-test"
);
const db = app.firestore();

async function run() {
  await db
    .collection("test_ping")
    .doc("ping")
    .set({ time: new Date().toISOString(), status: "alive" });
  const doc = await db.collection("test_ping").doc("ping").get();
  console.log(
    "✅ BACKUP DB IS FULLY ALIVE & WORKING! Read back data:",
    doc.data()
  );
  await db.collection("test_ping").doc("ping").delete();
  console.log("✅ Cleaned up ping doc.");
}

run().catch((err) => {
  console.error("Backup error:", err);
  process.exit(1);
});
