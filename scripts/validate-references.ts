import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";
const serviceAccountPath = path.join(
  process.cwd(),
  "bkgalabovo2025-firebase-adminsdk-fbsvc-b38c08a9e1.json"
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function run() {
  console.log("Fetching Training Templates...");
  const templatesSnap = await db.collection("training_templates").get();
  const templates: any[] = [];

  templatesSnap.forEach((doc) => {
    templates.push(doc.data() as any);
  });

  console.log(`Found ${templates.length} templates.`);

  // Actually, wait, ALL_EXERCISES in all.ts doesn't have "id" hardcoded for all of them, they are assigned in DB.
  // Let's fetch all exercises from the DB to be sure of the IDs.
  const exSnap = await db.collection("exercises").get();
  const dbExercises = new Map<string, any>();
  exSnap.forEach((doc) => {
    dbExercises.set(doc.id, doc.data());
  });

  console.log(`Found ${dbExercises.size} exercises in Firestore.`);

  const missingReferences = new Set<string>();
  const missingDetails = new Map<
    string,
    {
      exerciseId: string;
      exerciseName: string;
      templateId: string;
      templateName: string;
    }
  >();

  for (const tmpl of templates) {
    if (!tmpl.blocks) continue;
    for (const block of tmpl.blocks) {
      if (!block.exercises) continue;
      for (const ex of block.exercises) {
        if (!dbExercises.has(ex.exerciseId)) {
          missingReferences.add(ex.exerciseId);
          missingDetails.set(ex.exerciseId, {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            templateId: tmpl.id,
            templateName: tmpl.name,
          });
        }
      }
    }
  }

  if (missingReferences.size === 0) {
    console.log(
      "✅ SUCCESS: 100% of the exercises in templates exist in the database!"
    );
    fs.writeFileSync(
      path.join(__dirname, "missing-exercises.json"),
      JSON.stringify([], null, 2)
    );
  } else {
    console.log(`❌ ERROR: Found ${missingReferences.size} missing exercises!`);
    const missingArr = Array.from(missingDetails.values());
    console.log(missingArr);
    fs.writeFileSync(
      path.join(__dirname, "missing-exercises.json"),
      JSON.stringify(missingArr, null, 2)
    );
  }
}

run().catch(console.error);
