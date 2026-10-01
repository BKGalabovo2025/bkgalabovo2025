/**
 * scripts/migrate-to-backup.cjs
 * =============================
 * Скрипт за пълно копиране на основните колекции от bkgalabovo2025 към bkgalabovo2025-backup.
 * Стартира се с: node scripts/migrate-to-backup.cjs
 */
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// 1. Четене на .env.local
const envContent = fs.readFileSync(
  path.join(__dirname, "..", ".env.local"),
  "utf8"
);
const envLines = envContent.split("\n");
const env = {};
for (const line of envLines) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (
      (val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))
    ) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
}

function initApps() {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON липсва в .env.local");
  }
  if (!env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON липсва в .env.local");
  }

  const primarySa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (primarySa.private_key)
    primarySa.private_key = primarySa.private_key.replace(/\\n/g, "\n");

  const backupSa = JSON.parse(env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON);
  if (backupSa.private_key)
    backupSa.private_key = backupSa.private_key.replace(/\\n/g, "\n");

  const primaryApp = admin.initializeApp(
    { credential: admin.credential.cert(primarySa) },
    "primary-migration"
  );
  const backupApp = admin.initializeApp(
    { credential: admin.credential.cert(backupSa) },
    "backup-migration"
  );

  return {
    primaryDb: primaryApp.firestore(),
    backupDb: backupApp.firestore(),
  };
}

const COLLECTIONS_TO_MIGRATE = [
  "clubServices",
  "clubGeneralServices",
  "prices",
  "priceHistory",
  "members",
  "families",
  "users",
  "certificate_templates",
  "events",
  "exercises",
  "annual_plans",
  "training_templates",
  "feedback_templates",
  "focus_tags",
  "memberSubscriptions",
  "sales",
];

async function migrateCollection(primaryDb, backupDb, collectionName) {
  console.log("\n📦 Мигриране на колекция:", collectionName);
  try {
    const snapshot = await primaryDb.collection(collectionName).get();
    if (snapshot.empty) {
      console.log("   (Колекцията е празна — прескача се):", collectionName);
      return;
    }

    console.log(
      "   Намерени документи в колекцията:",
      snapshot.size,
      collectionName
    );

    // Писане на партиди по 400 документа (Firestore лимит на batch е 500)
    let batch = backupDb.batch();
    let count = 0;
    let totalWritten = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const targetRef = backupDb.collection(collectionName).doc(doc.id);
      batch.set(targetRef, data, { merge: true });
      count++;
      totalWritten++;

      if (count >= 400) {
        await batch.commit();
        console.log("   Записани документи:", totalWritten, "/", snapshot.size);
        batch = backupDb.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
    }
    console.log(
      "   ✅ Успешно копирани документи:",
      totalWritten,
      collectionName
    );
  } catch (err) {
    if (err.message && err.message.includes("RESOURCE_EXHAUSTED")) {
      console.error(
        "   ❌ Квотата на основната база е изчерпана за колекция:",
        collectionName
      );
      throw err;
    }
    console.error("   ❌ Грешка при колекция:", collectionName, err.message);
  }
}

async function main() {
  console.log("====================================================");
  console.log("🚀 СТАРТИРАНЕ НА МИГРАЦИЯ КЪМ РЕЗЕРВНАТА БАЗА ДАННИ");
  console.log("====================================================");

  const { primaryDb, backupDb } = initApps();

  for (const col of COLLECTIONS_TO_MIGRATE) {
    try {
      await migrateCollection(primaryDb, backupDb, col);
    } catch (err) {
      if (err.message && err.message.includes("RESOURCE_EXHAUSTED")) {
        console.log(
          "\n⚠️ Основната база е блокирана поради изчерпана квота (RESOURCE_EXHAUSTED)."
        );
        console.log(
          "👉 Моля преминете на Blaze план в bkgalabovo2025 или изчакайте нулирането на квотата."
        );
        break;
      }
    }
  }

  console.log("\n====================================================");
  console.log("🏁 Процесът приключи.");
  console.log("====================================================");
}

main().catch(console.error);
