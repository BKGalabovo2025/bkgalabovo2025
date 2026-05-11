import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length > 0) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const resolvedPath = path.resolve(process.cwd(), credPath);
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK инициализиран от файл:", resolvedPath);
      return;
    }
  }

  throw new Error(
    "❌ Не е намерен валиден service account файл. Провери GOOGLE_APPLICATION_CREDENTIALS в .env.local."
  );
}

async function migrateSiteId() {
  initAdmin();
  const adminDb = admin.firestore();

  console.log(
    "\n🚀 Стартиране на SiteId миграция за данните на БК Гълъбово...\n"
  );

  const collectionsToMigrate = [
    "members",
    "sales",
    "finances",
    "inventory",
    "reservations",
    "tournaments",
    "services",
  ];

  try {
    for (const collectionName of collectionsToMigrate) {
      const snapshot = await adminDb.collection(collectionName).get();

      if (snapshot.empty) {
        console.log(`  ⏭  ${collectionName}: няма документи.`);
        continue;
      }

      let updatedCount = 0;
      let skippedCount = 0;
      let batch = adminDb.batch();
      let batchCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.siteId) {
          batch.update(doc.ref, { siteId: "bkgalabovo" });
          batchCount++;
          updatedCount++;
          if (batchCount >= 500) {
            await batch.commit();
            batch = adminDb.batch();
            batchCount = 0;
          }
        } else {
          skippedCount++;
        }
      }

      if (batchCount > 0) await batch.commit();

      console.log(
        `  ✅ ${collectionName}: обновени ${updatedCount}, пропуснати ${skippedCount} (вече имат siteId).`
      );
    }

    console.log(
      "\n🎉 Миграцията завърши успешно! Всички данни имат siteId: 'bkgalabovo'."
    );
  } catch (error) {
    console.error("\n❌ Грешка при миграция:", error);
    process.exit(1);
  }
}

migrateSiteId();
