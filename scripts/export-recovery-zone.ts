import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// Данни от проекта Recovery Zone (взети от scratch/.env.local)
const recoveryZoneConfig = {
  // Credentials should be provided via environment variables or a local secrets file.
  // Do NOT commit service account keys into source control.
  projectId: process.env.RECOVERY_ZONE_PROJECT_ID || "recoveryzonebyzm-admin",
  clientEmail:
    process.env.RECOVERY_ZONE_CLIENT_EMAIL ||
    "firebase-adminsdk-fbsvc@recoveryzonebyzm-admin.iam.gserviceaccount.com",
  // Provide the private key via the env var `RECOVERY_ZONE_PRIVATE_KEY` with escaped newlines.
  privateKey: (process.env.RECOVERY_ZONE_PRIVATE_KEY || "REDACTED").replace(
    /\\n/g,
    "\n"
  ),
};

async function exportRecoveryZone() {
  console.log("🚀 Starting Export from Recovery Zone...");

  const recoveryApp = initializeApp(
    {
      credential: cert(recoveryZoneConfig as any),
    },
    "recovery-zone-app"
  );

  const db = getFirestore(recoveryApp);
  // Автоматично извличане на ВСИЧКИ колекции от корена
  const collections = await db.listCollections();
  const collectionsToExport = collections.map((col) => col.id);

  console.log(
    `- Found ${collectionsToExport.length} root collections: ${collectionsToExport.join(", ")}`
  );

  const exportData: Record<string, any> = {};

  for (const collectionName of collectionsToExport) {
    console.log(`- Fetching collection: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`  ! Collection ${collectionName} is empty.`);
      continue;
    }

    exportData[collectionName] = {};
    snapshot.forEach((doc) => {
      exportData[collectionName][doc.id] = doc.data();
    });
    console.log(`  -> Found ${snapshot.size} documents.`);
  }

  const outputPath = path.resolve(process.cwd(), "recovery-zone-export.json");
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  console.log(`\n✅ Export completed! Data saved to: ${outputPath}`);
  process.exit(0);
}

exportRecoveryZone().catch((err) => {
  console.error("❌ Export failed:", err);
  process.exit(1);
});
