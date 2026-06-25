import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import { getAdminDb } from "../src/lib/firebase-admin";
import { INITIAL_BWF_EXERCISES } from "../src/lib/badminton-exercises";
async function reseed() {
  const db = getAdminDb();
  console.log("Deleting all existing exercises...");
  const snapshot = await db.collection("exercises").get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log("Deleted " + snapshot.size + " exercises.");
  console.log("Seeding new exercises...");
  const seedBatch = db.batch();
  let count = 0;
  INITIAL_BWF_EXERCISES.forEach((ex) => {
    const docRef = db.collection("exercises").doc();
    seedBatch.set(docRef, {
      ...ex,
      siteId: "bkgalabovo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    count++;
  });
  await seedBatch.commit();
  console.log("Successfully seeded " + count + " exercises.");
}
reseed().catch(console.error);
