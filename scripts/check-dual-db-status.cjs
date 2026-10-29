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

async function testDbs() {
  const env = getEnv();

  // Primary
  const primarySa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (primarySa.private_key) primarySa.private_key = primarySa.private_key.replace(/\\n/g, "\n");
  const primaryApp = admin.initializeApp({ credential: admin.credential.cert(primarySa) }, "primary-check");
  const primaryDb = primaryApp.firestore();

  // Backup
  const backupSa = JSON.parse(env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON);
  if (backupSa.private_key) backupSa.private_key = backupSa.private_key.replace(/\\n/g, "\n");
  const backupApp = admin.initializeApp({ credential: admin.credential.cert(backupSa) }, "backup-check");
  const backupDb = backupApp.firestore();

  console.log("=== Проверка на Основна База (" + primarySa.project_id + ") ===");
  let primaryAlive = false;
  try {
    const primaryTest = await primaryDb.collection("sites").limit(1).get();
    console.log("✅ Основната база отговаря! Намерени сайтове:", primaryTest.size);
    primaryAlive = true;
  } catch (err) {
    console.log("⚠️ Основната база върна грешка:", err.message);
  }

  console.log("\n=== Проверка на Резервна База (" + backupSa.project_id + ") ===");
  let backupAlive = false;
  try {
    const backupTest = await backupDb.collection("sites").limit(1).get();
    console.log("✅ Резервната база отговаря! Намерени сайтове:", backupTest.size);
    backupAlive = true;
  } catch (err) {
    console.log("⚠️ Резервната база върна грешка:", err.message);
  }

  const collections = [
    "sites",
    "members",
    "families",
    "parent_users",
    "parent_requests",
    "parent_absences",
    "parent_corrections",
    "parent_activity_logs",
    "clubServices",
    "prices",
    "events",
    "sales"
  ];
  console.log("\n=== Сравнение на брой документи по колекции ===");
  console.log("Колекция              | Основна   | Резервна");
  console.log("---------------------------------------------");

  for (const col of collections) {
    let pCount = "Грешка";
    let bCount = "Грешка";

    try {
      const pSnap = await primaryDb.collection(col).get();
      pCount = pSnap.size;
    } catch (e) {
      pCount = e.message && e.message.includes("RESOURCE_EXHAUSTED") ? "EXHAUSTED" : "ERR";
    }

    try {
      const bSnap = await backupDb.collection(col).get();
      bCount = bSnap.size;
    } catch (e) {
      bCount = "ERR";
    }

    console.log(`${col.padEnd(21)} | ${String(pCount).padEnd(9)} | ${String(bCount).padEnd(8)}`);
  }
}

testDbs().catch(console.error);
