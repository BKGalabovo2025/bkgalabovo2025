import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { getAdminDb } from "../src/lib/firebase-admin";

async function main() {
  const adminDb = getAdminDb();

  const targetMemberId = "qTi6Azb7x1IvZY0l9bct";
  const targetMemberName = "Самуил Петров";

  let paymentStatus = "paid";
  let paymentType = "subscription";
  let saleId = "";
  let paymentDate = new Date().toISOString();

  // Find paid events to copy the actual saleId and date if we couldn't find the sale directly
  const eventsSnapshot = await adminDb.collection("events").get();
  for (const doc of eventsSnapshot.docs) {
    const data = doc.data();
    if (!data.startDate) continue;

    if (data.type === "training" || data.title === "Тренировка") {
      let attendees = data.attendees || [];
      for (const a of attendees) {
        if (
          (a.memberId === targetMemberId ||
            a.memberId === `members/${targetMemberId}`) &&
          a.paymentStatus === "paid" &&
          a.saleId
        ) {
          saleId = a.saleId;
          paymentDate = a.paymentDate || paymentDate;
          paymentType = a.paymentType || paymentType;
        }
      }
    }
  }

  if (!saleId) {
    console.log(
      "Could not find any existing paid event for this member to copy saleId from. Using default."
    );
  }

  console.log(
    `Using saleId: ${saleId}, paymentDate: ${paymentDate}, paymentType: ${paymentType}`
  );

  let updatedCount = 0;
  for (const doc of eventsSnapshot.docs) {
    const data = doc.data();
    if (!data.startDate) continue;

    let startDate =
      typeof data.startDate === "string"
        ? new Date(data.startDate)
        : data.startDate?.toDate?.();
    if (!startDate || startDate.getMonth() < 0 || startDate.getMonth() > 4)
      continue; // Jan to May

    if (data.type === "training" || data.title === "Тренировка") {
      let attendees = data.attendees || [];
      let attendeeMemberIds = data.attendeeMemberIds || [];
      let modified = false;

      let found = false;
      attendees = attendees.map((a: any) => {
        if (
          a.memberId === targetMemberId ||
          a.memberId === `members/${targetMemberId}`
        ) {
          found = true;
          if (!a.attended || a.paymentStatus !== "paid") {
            a.attended = true;
            a.paymentStatus = "paid";
            a.paymentType = paymentType;
            a.saleId = saleId;
            a.paymentDate = paymentDate;
            modified = true;
          }
        }
        return a;
      });

      if (!found) {
        attendees.push({
          memberId: targetMemberId,
          name: targetMemberName,
          attended: true,
          paymentStatus: "paid",
          paymentType: paymentType,
          saleId: saleId,
          paymentDate: paymentDate,
        });
        if (!attendeeMemberIds.includes(targetMemberId)) {
          attendeeMemberIds.push(targetMemberId);
        }
        modified = true;
      }

      if (modified) {
        await doc.ref.update({
          attendees,
          attendeeMemberIds,
        });
        updatedCount++;
        console.log(
          `Updated attendance and payment for event ${doc.id} on ${startDate.toISOString()}`
        );
      }
    }
  }

  console.log(
    `Total events updated (attendance + payment) for Jan to May: ${updatedCount}`
  );
}

main().catch(console.error);
