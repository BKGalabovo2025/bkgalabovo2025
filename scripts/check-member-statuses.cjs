const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

function getEnv() {
  const env = { ...process.env };
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith("'") && val.endsWith("'")) ||
          (val.startsWith('"') && val.endsWith('"'))
        ) {
          val = val.slice(1, -1);
        }
        if (!env[key]) {
          env[key] = val;
        }
      }
    }
  }
  return env;
}

function parseDate(val) {
  if (!val) return new Date(0);
  if (typeof val?.toDate === "function") return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function isQuotaError(err) {
  return (
    err?.code === 8 ||
    /RESOURCE_EXHAUSTED|Quota exceeded/i.test(String(err?.message || err))
  );
}

function formatDateTimeSofia() {
  return new Date().toLocaleString("bg-BG", { timeZone: "Europe/Sofia" });
}

async function main() {
  const env = getEnv();
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON липсва.");
  }

  const primarySa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (primarySa.private_key) {
    primarySa.private_key = primarySa.private_key.replace(/\\n/g, "\n");
  }

  const primaryApp = admin.initializeApp(
    { credential: admin.credential.cert(primarySa) },
    "check-statuses-primary"
  );
  const primaryDb = primaryApp.firestore();

  let backupDb = null;
  if (env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON) {
    const backupSa = JSON.parse(env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON);
    if (backupSa.private_key) {
      backupSa.private_key = backupSa.private_key.replace(/\\n/g, "\n");
    }
    const backupApp = admin.initializeApp(
      { credential: admin.credential.cert(backupSa) },
      "check-statuses-backup"
    );
    backupDb = backupApp.firestore();
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  // Икономично четене: само 3 заявки общо (вместо по 2 заявки на всеки неактивен член)
  const loadData = async (db) => {
    const members = await db.collection("members").get();
    const [sales, events] = await Promise.all([
      db
        .collection("sales")
        .where("saleDate", ">=", thirtyDaysAgoIso)
        .get()
        .catch((err) => {
          if (isQuotaError(err)) throw err;
          return { docs: [] };
        }),
      db
        .collection("events")
        .where("startDate", ">=", thirtyDaysAgoIso)
        .get()
        .catch((err) => {
          if (isQuotaError(err)) throw err;
          return { docs: [] };
        }),
    ]);
    return [members, sales, events];
  };

  let membersSnap, recentSalesSnap, recentEventsSnap;
  let readFromBackup = false;
  try {
    [membersSnap, recentSalesSnap, recentEventsSnap] =
      await loadData(primaryDb);
  } catch (err) {
    if (!isQuotaError(err)) throw err;
    if (!backupDb) {
      console.warn(
        "⚠️ Квотата на основната Firestore е изчерпана и няма резервна база. Проверката се пропуска до възстановяване на квотата (дневно рестартиране)."
      );
      console.log("::warning::Firestore quota exceeded - member status check skipped");
      return;
    }
    console.warn(
      "⚠️ Квотата на основната Firestore е изчерпана. Четене от резервната база..."
    );
    [membersSnap, recentSalesSnap, recentEventsSnap] =
      await loadData(backupDb);
    readFromBackup = true;
  }

  const recentActivityByMember = new Map();
  const bumpActivity = (memberId, dateVal) => {
    if (!memberId) return;
    const dt = parseDate(dateVal);
    if (dt.getTime() <= 0) return;
    const prev = recentActivityByMember.get(memberId);
    if (!prev || dt > prev) {
      recentActivityByMember.set(memberId, dt);
    }
  };

  for (const doc of recentSalesSnap.docs) {
    const d = doc.data();
    bumpActivity(d.memberId, d.saleDate);
  }

  for (const doc of recentEventsSnap.docs) {
    const d = doc.data();
    if (Array.isArray(d.attendeeMemberIds)) {
      for (const memberId of d.attendeeMemberIds) {
        bumpActivity(memberId, d.startDate);
      }
    }
  }

  let deactivatedCount = 0;
  let activatedCount = 0;
  const updates = [];

  for (const doc of membersSnap.docs) {
    const d = doc.data();
    const currentStatus = d.status || "active";
    if (currentStatus !== "active" && currentStatus !== "inactive") continue;

    let lastActivityDate = new Date(0);
    for (const f of [d.registrationDate, d.lastActivityDate, d.lastPaymentDate]) {
      const dt = parseDate(f);
      if (dt > lastActivityDate) lastActivityDate = dt;
    }

    const recentFromQueries = recentActivityByMember.get(doc.id);
    if (recentFromQueries && recentFromQueries > lastActivityDate) {
      lastActivityDate = recentFromQueries;
    }

    const isInactive = lastActivityDate < thirtyDaysAgo;
    let newStatus = currentStatus;
    let note = "";

    if (isInactive && currentStatus === "active") {
      newStatus = "inactive";
      note = `\n[${formatDateTimeSofia()}] Системата автоматично промени статуса на "неактивен" поради липса на активност над 30 дни (последна активност: ${lastActivityDate.toLocaleDateString("bg-BG")}).`;
      deactivatedCount++;
    } else if (!isInactive && currentStatus === "inactive") {
      newStatus = "active";
      note = `\n[${formatDateTimeSofia()}] Системата автоматично промени статуса на "активен" поради регистрирана нова активност (последна активност: ${lastActivityDate.toLocaleDateString("bg-BG")}).`;
      activatedCount++;
    }

    if (newStatus !== currentStatus) {
      const existingNotes = d.notes || "";
      const payload = {
        status: newStatus,
        notes: (existingNotes + note).trim(),
        ...(lastActivityDate.getTime() > 0
          ? { lastActivityDate: lastActivityDate.toISOString() }
          : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      updates.push({ id: doc.id, ref: doc.ref, payload });
    }
  }

  if (updates.length > 0) {
    const primaryBatch = primaryDb.batch();
    const backupBatch = backupDb ? backupDb.batch() : null;

    for (const item of updates) {
      primaryBatch.update(item.ref, item.payload);
      if (backupBatch && backupDb) {
        backupBatch.set(
          backupDb.collection("members").doc(item.id),
          item.payload,
          { merge: true }
        );
      }
    }

    if (readFromBackup) {
      // Основната база е на квота - актуализираме само резервната;
      // sync-backup ще синхронизира основната след възстановяване на квотата.
      console.warn(
        "⚠️ Основната база е на изчерпана квота - записът в нея се пропуска."
      );
    } else {
      await primaryBatch.commit().catch((err) => {
        if (!isQuotaError(err)) throw err;
        console.warn(
          "⚠️ Квотата на основната база се изчерпа при запис - обновява се само резервната."
        );
      });
    }
    if (backupBatch) {
      await backupBatch.commit().catch((err) => {
        console.warn("⚠️ Backup DB status update warning:", err.message);
      });
    }
  }

  console.log(
    `✅ Проверка на статусите приключи: общо ${membersSnap.size} члена | Деактивирани: ${deactivatedCount} | Активирани: ${activatedCount}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Грешка при проверка на статусите:", err);
    process.exit(1);
  });
