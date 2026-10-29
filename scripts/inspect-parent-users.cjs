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

async function inspectParentUsers() {
  const env = getEnv();

  const primarySa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (primarySa.private_key) primarySa.private_key = primarySa.private_key.replace(/\\n/g, "\n");
  const primaryApp = admin.initializeApp({ credential: admin.credential.cert(primarySa) }, "p-inspect");
  const primaryDb = primaryApp.firestore();

  const backupSa = JSON.parse(env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON);
  if (backupSa.private_key) backupSa.private_key = backupSa.private_key.replace(/\\n/g, "\n");
  const backupApp = admin.initializeApp({ credential: admin.credential.cert(backupSa) }, "b-inspect");
  const backupDb = backupApp.firestore();

  console.log("--- Primary parent_users ---");
  const pUsers = await primaryDb.collection("parent_users").get();
  pUsers.forEach(d => console.log(d.id, d.data().email, d.data().phone));

  console.log("--- Backup parent_users ---");
  const bUsers = await backupDb.collection("parent_users").get();
  bUsers.forEach(d => console.log(d.id, d.data().email, d.data().phone));
}

inspectParentUsers().catch(console.error);
