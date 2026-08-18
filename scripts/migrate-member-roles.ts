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

async function migrateMemberRoles() {
  initAdmin();
  const adminDb = admin.firestore();

  console.log(
    "\n🚀 Стартиране на миграция: Замяна на memberType с isClubMember, isRecoveryMember, isGuest...\n"
  );

  try {
    const snapshot = await adminDb.collection("members").get();

    if (snapshot.empty) {
      console.log(`  ⏭ Няма документи за мигриране.`);
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let batch = adminDb.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates: any = {};

      // If they already have the new flags mapped and verified, we could technically skip,
      // but let's ensure old memberType is properly mapped for everyone who doesn't have it.
      if (data.memberType) {
        if (data.memberType === "regular" && data.isClubMember !== true) {
          updates.isClubMember = true;
        }
        if (data.memberType === "recovery" && data.isRecoveryMember !== true) {
          updates.isRecoveryMember = true;
        }
        if (data.memberType === "guest" && data.isGuest !== true) {
          updates.isGuest = true;
        }
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
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
      `  ✅ Миграцията завърши: обновени ${updatedCount}, пропуснати ${skippedCount} (вече имат правилни флагове).`
    );
  } catch (error) {
    console.error("\n❌ Грешка при миграция:", error);
    process.exit(1);
  }
}

migrateMemberRoles();
