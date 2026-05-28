import { getAdminDb } from "./src/lib/firebase-admin.ts";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const adminDb = getAdminDb();
  const snaps = await Promise.all([
    adminDb.collection("sales").get(),
    adminDb.collection("training_sales").get(),
    adminDb.collection("inventory_sales").get(),
  ]);
  let found = false;
  snaps.forEach((s) =>
    s.docs.forEach((d) => {
      if (d.id.toUpperCase().startsWith("SDBQGTOD")) {
        console.log("Collection:", d.ref.parent.id);
        console.log("ID:", d.id);
        console.log("Data:", JSON.stringify(d.data(), null, 2));
        found = true;
      }
    })
  );
  if (!found) console.log("Not found");
}
run();
