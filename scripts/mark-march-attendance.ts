import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { getAdminDb } from "../src/lib/firebase-admin";

async function main() {
  const adminDb = getAdminDb();

  const snapshot = await adminDb.collection("events").get();
  let updatedCount = 0;

  const targetMemberId = "y4DLe4JHS1xabT5YrVAY";
  const targetMemberName = "Жулиен Димитров";

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.startDate) continue;

    let startDate: Date;
    if (typeof data.startDate === "string") {
      startDate = new Date(data.startDate);
    } else if (data.startDate && typeof data.startDate.toDate === "function") {
      startDate = data.startDate.toDate();
    } else {
      continue;
    }

    // Check for Jan (0) to June (5)
    if (startDate.getMonth() >= 0 && startDate.getMonth() <= 5) {
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
            if (!a.attended) {
              a.attended = true;
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
            `Updated attendance for event ${doc.id} on ${startDate.toISOString()} (Title: ${data.title})`
          );
        }
      }
    }
  }

  console.log(`Total trainings from Jan to June updated: ${updatedCount}`);
}

main().catch(console.error);
