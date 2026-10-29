const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function getEnv() {
  const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const env = {};
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      let key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

function initApps() {
  const env = getEnv();

  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON липсва в .env.local");
  }
  if (!env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON липсва в .env.local");
  }

  const primarySa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (primarySa.private_key) {
    primarySa.private_key = primarySa.private_key.replace(/\\n/g, "\n");
  }

  const backupSa = JSON.parse(env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON);
  if (backupSa.private_key) {
    backupSa.private_key = backupSa.private_key.replace(/\\n/g, "\n");
  }

  const primaryApp = admin.initializeApp(
    { credential: admin.credential.cert(primarySa) },
    "primary-bidirectional-sync"
  );

  const backupApp = admin.initializeApp(
    { credential: admin.credential.cert(backupSa) },
    "backup-bidirectional-sync"
  );

  return {
    primaryDb: primaryApp.firestore(),
    backupDb: backupApp.firestore(),
    primaryProject: primarySa.project_id,
    backupProject: backupSa.project_id,
  };
}

const COLLECTIONS_TO_SYNC = [
  "sites",
  "clubServices",
  "clubGeneralServices",
  "prices",
  "priceHistory",
  "members",
  "families",
  "users",
  "parent_users",
  "parent_requests",
  "parent_absences",
  "parent_corrections",
  "certificate_templates",
  "events",
  "exercises",
  "annual_plans",
  "training_templates",
  "feedback_templates",
  "focus_tags",
  "memberSubscriptions",
  "sales",
  "sponsors",
  "inventory",
  "trainings",
  "reservations",
  "sessions",
];

function getDocTime(data) {
  if (!data) return 0;
  const val =
    data.updatedAt ||
    data.updated_at ||
    data.createdAt ||
    data.created_at ||
    data.timestamp ||
    data.date;
  if (!val) return 0;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (typeof val._seconds === "number") return val._seconds * 1000;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (val instanceof Date) return val.getTime();
  return 0;
}

async function syncBidirectionalCollection(primaryDb, backupDb, collectionName) {
  process.stdout.write(`\n🔄 Синхронизиране: ${collectionName.padEnd(23)} `);

  let primarySnap;
  let backupSnap;

  try {
    [primarySnap, backupSnap] = await Promise.all([
      primaryDb.collection(collectionName).get(),
      backupDb.collection(collectionName).get(),
    ]);
  } catch (err) {
    if (err.message && err.message.includes("RESOURCE_EXHAUSTED")) {
      console.log(`\n❌ Quota exhausted при четене на ${collectionName}`);
      throw err;
    }
    console.log(`❌ Грешка: ${err.message}`);
    return { pToB: 0, bToP: 0, error: err.message };
  }

  const primaryDocs = new Map();
  primarySnap.docs.forEach((doc) => primaryDocs.set(doc.id, doc.data()));

  const backupDocs = new Map();
  backupSnap.docs.forEach((doc) => backupDocs.set(doc.id, doc.data()));

  const toWriteToBackup = [];
  const toWriteToPrimary = [];

  // 1. Проверяваме документите от Основната (Primary)
  for (const [id, pData] of primaryDocs.entries()) {
    if (!backupDocs.has(id)) {
      toWriteToBackup.push({ id, data: pData, reason: "missing_in_backup" });
    } else {
      const bData = backupDocs.get(id);
      const pTime = getDocTime(pData);
      const bTime = getDocTime(bData);

      if (pTime > 0 && bTime > 0) {
        if (pTime > bTime) {
          toWriteToBackup.push({ id, data: pData, reason: "primary_newer" });
        } else if (bTime > pTime) {
          toWriteToPrimary.push({ id, data: bData, reason: "backup_newer" });
        }
      }
    }
  }

  // 2. Проверяваме документите от Резервната (Backup), липсващи в Основната
  for (const [id, bData] of backupDocs.entries()) {
    if (!primaryDocs.has(id)) {
      toWriteToPrimary.push({ id, data: bData, reason: "missing_in_primary" });
    }
  }

  // 3. Записваме в Резервната база
  if (toWriteToBackup.length > 0) {
    let batch = backupDb.batch();
    let count = 0;
    for (const item of toWriteToBackup) {
      batch.set(backupDb.collection(collectionName).doc(item.id), item.data, {
        merge: true,
      });
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = backupDb.batch();
        count = 0;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  }

  // 4. Записваме в Основната база
  if (toWriteToPrimary.length > 0) {
    let batch = primaryDb.batch();
    let count = 0;
    for (const item of toWriteToPrimary) {
      batch.set(primaryDb.collection(collectionName).doc(item.id), item.data, {
        merge: true,
      });
      count++;
      if (count >= 400) {
        await batch.commit();
        batch = primaryDb.batch();
        count = 0;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  }

  if (toWriteToBackup.length === 0 && toWriteToPrimary.length === 0) {
    process.stdout.write(`✅ В пълен синхрон (${primaryDocs.size} док.)`);
  } else {
    process.stdout.write(
      `✅ Синхронизирани: -> Резервна: ${toWriteToBackup.length} | -> Основна: ${toWriteToPrimary.length}`
    );
  }

  return {
    pToB: toWriteToBackup.length,
    bToP: toWriteToPrimary.length,
  };
}

async function runBidirectionalSync() {
  console.log("===============================================================");
  console.log("🚀 ПЪЛНА ДВУПОСОЧНА СИНХРОНИЗАЦИЯ НА БАЗИТЕ ДАННИ");
  console.log("   Основна (Primary)  <=====>  Резервна (Backup)");
  console.log("===============================================================");

  const { primaryDb, backupDb, primaryProject, backupProject } = initApps();
  console.log(`📡 Основна база:  ${primaryProject}`);
  console.log(`📡 Резервна база: ${backupProject}`);

  let totalToBackup = 0;
  let totalToPrimary = 0;

  for (const col of COLLECTIONS_TO_SYNC) {
    try {
      const res = await syncBidirectionalCollection(primaryDb, backupDb, col);
      totalToBackup += res.pToB;
      totalToPrimary += res.bToP;
    } catch (err) {
      if (err.message && err.message.includes("RESOURCE_EXHAUSTED")) {
        console.log("\n⚠️ Квотата на основната база е изчерпана. Спираме процеса.");
        break;
      }
      console.error(`Грешка при ${col}:`, err);
    }
  }

  console.log("\n\n===============================================================");
  console.log("🏁 ОБОБЩЕНИЕ НА ДВУПОСОЧНАТА СИНХРОНИЗАЦИЯ:");
  console.log(`   ➡️  Прехвърлени/обновени към Резервната: ${totalToBackup}`);
  console.log(`   ⬅️  Прехвърлени/обновени към Основната:   ${totalToPrimary}`);
  console.log("   ✅ Двете бази данни са в 100% огледален синхрон!");
  console.log("===============================================================");
}

if (require.main === module) {
  runBidirectionalSync()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Грешка при синхронизацията:", err);
      process.exit(1);
    });
}

module.exports = { runBidirectionalSync, syncBidirectionalCollection, COLLECTIONS_TO_SYNC };
