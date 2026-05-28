/**
 * SYNC SCRIPT: Синхронизира статуса на плащане за всички присъствия
 * с платените абонаменти в базата данни.
 *
 * Как работи:
 * 1. Взима всички продажби от тип "training_service" със статус "completed"
 * 2. За всяка продажба взима всички тренировки за съответния месец (targetMonths)
 * 3. За всеки засегнат член маркира присъствията му в тренировките като "paid"
 * 4. Прави всичко в batch операции за максимална ефективност
 */

require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");

// Initialize Firebase Admin
let app;
try {
  app = admin.app();
} catch {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local");
    process.exit(1);
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(
      /\\n/g,
      "\n"
    );
  }
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function syncAttendancePayments() {
  console.log("🚀 Стартиране на синхронизация...\n");

  // Step 1: Get all completed training_service sales
  const salesSnap = await db
    .collection("sales")
    .where("type", "==", "training_service")
    .where("status", "==", "completed")
    .get();

  console.log(`📋 Намерени ${salesSnap.size} абонаментни продажби\n`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalEvents = 0;

  for (const saleDoc of salesSnap.docs) {
    const sale = saleDoc.data();
    const saleId = saleDoc.id;

    // Get the member IDs this sale covers
    const targetMemberIds =
      sale.memberIdsForAttendance ||
      (sale.memberIdForAttendance
        ? [sale.memberIdForAttendance]
        : sale.memberId
          ? [sale.memberId]
          : []);

    if (targetMemberIds.length === 0) {
      console.log(
        `  ⚠️  Продажба ${saleId.substring(0, 8).toUpperCase()} — няма целеви членове, пропускам`
      );
      continue;
    }

    // Get covered months (e.g. ["2026-05"])
    const targetMonths = sale.targetMonths || [];
    const targetMonthLabels = sale.targetMonthLabels || [];
    const paymentMode = sale.paymentMode || "subscription";
    const paymentType =
      paymentMode === "subscription" ? "subscription" : "individual";
    const paymentDate =
      sale.saleDate?.toDate?.()?.toISOString() ||
      sale.saleDate ||
      new Date().toISOString();

    if (targetMonths.length === 0 && targetMonthLabels.length === 0) {
      console.log(
        `  ⚠️  Продажба ${saleId.substring(0, 8).toUpperCase()} — няма целеви месеци, пропускам`
      );
      continue;
    }

    const memberNames = targetMemberIds.join(", ").substring(0, 40);
    const monthsLabel =
      targetMonthLabels.length > 0
        ? targetMonthLabels.join(", ")
        : targetMonths.join(", ");
    console.log(
      `\n💳 Продажба ${saleId.substring(0, 8).toUpperCase()} — Месеци: ${monthsLabel}`
    );
    console.log(`   Членове: ${memberNames}...`);

    // Step 2: Find all events for each target member
    // Query events where any of the targetMemberIds are in attendeeMemberIds
    for (const memberId of targetMemberIds) {
      const eventsSnap = await db
        .collection("events")
        .where("attendeeMemberIds", "array-contains", memberId)
        .get();

      let memberUpdated = 0;

      // Process in batches of 500 (Firestore limit)
      const batchSize = 400;
      let batch = db.batch();
      let batchCount = 0;

      for (const eventDoc of eventsSnap.docs) {
        const event = eventDoc.data();

        // Check if this event's month is in the covered months
        let eventDate;
        if (event.startDate && typeof event.startDate.toDate === "function") {
          eventDate = event.startDate.toDate();
        } else if (event.startDate) {
          eventDate = new Date(event.startDate);
        } else {
          continue;
        }

        const eventMonthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;

        // Check if this event month is covered by the sale
        const isCovered =
          targetMonths.includes(eventMonthKey) ||
          targetMonthLabels.some((label) => {
            // Convert label like "Май 2026" to check
            return label.includes(String(eventDate.getFullYear()));
          });

        if (!isCovered) continue;

        // Find the attendee record for this member
        const attendees = event.attendees || [];
        const attendeeIdx = attendees.findIndex((a) => a.memberId === memberId);

        if (attendeeIdx === -1) continue; // Member not in this event

        const attendee = attendees[attendeeIdx];

        // Skip if not attended
        if (!attendee.attended) {
          totalSkipped++;
          continue;
        }

        // Skip if already marked as paid by THIS sale
        if (attendee.paymentStatus === "paid" && attendee.saleId === saleId) {
          totalSkipped++;
          continue;
        }

        // Update the attendee's payment status
        const updatedAttendees = [...attendees];
        updatedAttendees[attendeeIdx] = {
          ...attendee,
          paymentStatus: "paid",
          paymentType: paymentType,
          paymentDate: paymentDate,
          saleId: saleId,
        };

        batch.update(eventDoc.ref, { attendees: updatedAttendees });
        memberUpdated++;
        totalUpdated++;
        totalEvents++;
        batchCount++;

        // Commit batch if we're at the limit
        if (batchCount >= batchSize) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
          console.log(`   ✅ Batch commit (${batchSize} записа)`);
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
      }

      if (memberUpdated > 0) {
        console.log(
          `   ✅ Член ${memberId.substring(0, 8)}: обновени ${memberUpdated} тренировки`
        );
      } else {
        console.log(
          `   ℹ️  Член ${memberId.substring(0, 8)}: няма нови тренировки за обновяване`
        );
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ СИНХРОНИЗАЦИЯТА ПРИКЛЮЧИ!");
  console.log(`   📊 Обновени присъствия: ${totalUpdated}`);
  console.log(
    `   ⏭️  Пропуснати (вече платени/неприсъствали): ${totalSkipped}`
  );
  console.log("=".repeat(60));
}

syncAttendancePayments()
  .then(() => {
    console.log("\n🎉 Готово! Базата данни е синхронизирана.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Грешка при синхронизация:", err);
    process.exit(1);
  });
