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
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function run() {
  console.log("Updating exercises to include U17...");
  const exSnap = await db.collection("exercises").get();

  let exUpdated = 0;
  for (const doc of exSnap.docs) {
    const data = doc.data();
    let ageGroups = data.ageGroups || [];

    // If it has U15 or U19, and it doesn't have U17, add U17
    if (
      (ageGroups.includes("U15") || ageGroups.includes("U19")) &&
      !ageGroups.includes("U17")
    ) {
      ageGroups.push("U17");

      // Sort age groups logically
      const order = ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"];
      ageGroups.sort(
        (a: string, b: string) => order.indexOf(a) - order.indexOf(b)
      );

      await db.collection("exercises").doc(doc.id).update({ ageGroups });
      exUpdated++;
    }
  }
  console.log(`✅ Updated ${exUpdated} exercises to include U17.`);

  console.log("Updating Annual Plans...");
  const plansSnap = await db.collection("annual_plans").get();
  let plansUpdated = 0;

  for (const doc of plansSnap.docs) {
    const data = doc.data();
    let updated = false;

    // Check plan 3 (previously "Състезатели U15-U19" or similar)
    if (data.name.includes("U15") && data.name.includes("U19")) {
      data.name =
        "Едногодишна Програма U17 / U19 (Юноши/Девойки & Младежи/Девойки)";
      data.targetAgeGroups = ["U17", "U19", "Мъже и Жени"];
      updated = true;
    }

    // Check plan 2 (previously "U13/U15")
    if (
      data.name.includes("U13") &&
      data.name.includes("U15") &&
      !data.name.includes("U19")
    ) {
      data.name = "Едногодишна Програма U13 / U15 / U17 ( Юноши & Младежи )";
      data.targetAgeGroups = ["U13", "U15", "U17"];
      updated = true;
    }

    if (updated) {
      await db.collection("annual_plans").doc(doc.id).update({
        name: data.name,
        targetAgeGroups: data.targetAgeGroups,
      });
      console.log(`Renamed plan to: ${data.name}`);
      plansUpdated++;
    }
  }

  console.log("Updating Training Templates...");
  const templatesSnap = await db.collection("training_templates").get();
  let templatesUpdated = 0;

  for (const doc of templatesSnap.docs) {
    const data = doc.data();
    let updated = false;

    if (
      data.name.includes("U15-U19") ||
      (data.name.includes("U15") && data.name.includes("U19"))
    ) {
      data.name = data.name.replace("U15-U19", "U17-U19");
      if (!data.targetAgeGroups.includes("U17")) {
        data.targetAgeGroups.push("U17");
      }
      updated = true;
    } else if (data.name.includes("U13/U15")) {
      data.name = data.name.replace("U13/U15", "U13/U15/U17");
      if (!data.targetAgeGroups.includes("U17")) {
        data.targetAgeGroups.push("U17");
      }
      updated = true;
    }

    if (updated) {
      await db.collection("training_templates").doc(doc.id).update({
        name: data.name,
        targetAgeGroups: data.targetAgeGroups,
      });
      console.log(`Renamed template to: ${data.name}`);
      templatesUpdated++;
    }
  }

  console.log(
    `✅ Updated ${plansUpdated} annual plans and ${templatesUpdated} templates.`
  );
}

run().catch(console.error);
