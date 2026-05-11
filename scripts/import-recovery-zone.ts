import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as fs from "fs";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const serviceAccountPath =
  "./bkgalabovo2025-firebase-adminsdk-fbsvc-b38c08a9e1.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

const app = initializeApp(
  {
    credential: cert(serviceAccount),
  },
  "target-app"
);

const db = getFirestore(app);

async function importData() {
  console.log(`Target project: ${serviceAccount.project_id}`);

  if (!fs.existsSync("recovery-zone-export.json")) {
    console.error("recovery-zone-export.json not found");
    process.exit(1);
  }

  const rawData = fs.readFileSync("recovery-zone-export.json", "utf8");
  const data = JSON.parse(rawData);

  for (const [collectionName, documents] of Object.entries(data)) {
    console.log(`\nImporting collection: ${collectionName}`);
    const colRef = db.collection(collectionName);
    const docEntries = Object.entries(documents as Record<string, any>);

    let count = 0;
    for (const [docId, docData] of docEntries) {
      // Add siteId
      const transformedData = {
        ...docData,
        siteId: "recoveryzone",
      };

      // Recursively convert timestamps and handle references
      const processValues = (obj: any): any => {
        if (obj === null || typeof obj !== "object") return obj;

        // Handle Firestore Timestamps
        if (
          Object.keys(obj).length === 2 &&
          "_seconds" in obj &&
          "_nanoseconds" in obj
        ) {
          return new Timestamp(obj._seconds, obj._nanoseconds);
        }

        // Handle Firestore References (convert to path string)
        if ("_path" in obj && obj._path?.segments) {
          return obj._path.segments.join("/");
        }

        if (Array.isArray(obj)) {
          return obj.map(processValues);
        }

        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[key] = processValues(value);
        }
        return newObj;
      };

      const finalData = processValues(transformedData);

      try {
        await colRef.doc(docId).set(finalData);
        count++;
        if (count % 10 === 0)
          console.log(`  Progress: ${count}/${docEntries.length}`);
      } catch (error) {
        console.error(`  Error importing doc ${docId}:`, error);
      }
    }
    console.log(`  Finished ${collectionName}: ${count} docs imported.`);
  }

  console.log("\nMigration completed successfully!");
}

importData().catch(console.error);
