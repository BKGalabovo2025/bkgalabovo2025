import admin from "firebase-admin";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
console.log("SERVICE_ACCOUNT_JSON present:", !!SERVICE_ACCOUNT_JSON);

// Dynamic import after env is loaded
const { getSiteConfig } = await import("@/config/sites");

function initializeAdmin() {
  if (admin.apps && admin.apps.length > 0) return admin;

  if (SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(
          /\\n/g,
          "\n"
        );
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket:
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          "bkgalabovo2025.appspot.com",
      });
      console.log("Firebase Admin initialized via service account");
      return admin;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
  }

  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:
          process.env.FIREBASE_PROJECT_ID ||
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        "bkgalabovo2025.appspot.com",
    });
    console.log("Firebase Admin initialized via env vars");
    return admin;
  }

  // Try Google Application Default Credentials
  const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (googleCreds) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log(
      "Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS"
    );
    return admin;
  }

  console.error("No Firebase Admin credentials found");
  process.exit(1);
}

async function migrateCollection(
  db: admin.firestore.Firestore,
  collectionName: string,
  siteId: string,
  dryRun: boolean = false
) {
  console.log(`\n=== Processing ${collectionName} for siteId: ${siteId} ===`);

  const snapshot = await db.collection(collectionName).get();
  console.log(`Total documents: ${snapshot.size}`);

  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;
  const MAX_BATCH = 450;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (
      data.siteId === undefined ||
      data.siteId === null ||
      data.siteId === ""
    ) {
      if (dryRun) {
        console.log(
          `  [DRY RUN] Would update ${collectionName}/${doc.id} -> siteId: ${siteId}`
        );
      } else {
        batch.update(doc.ref, { siteId });
        batchCount++;
      }
      updated++;
    } else {
      skipped++;
    }

    if (batchCount >= MAX_BATCH) {
      if (!dryRun) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} updates`);
      }
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0 && !dryRun) {
    await batch.commit();
    console.log(`  Committed final batch of ${batchCount} updates`);
  }

  console.log(
    `  Updated: ${updated}, Skipped (already had siteId): ${skipped}`
  );
  return { updated, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const targetSite = args.find((a) => a.startsWith("--site="))?.split("=")[1];

  console.log(`Migration: Add siteId to legacy documents`);
  console.log(`Dry run: ${dryRun}`);

  const admin = initializeAdmin();
  const db = admin.firestore();

  const sites = targetSite ? [targetSite] : ["bkgalabovo", "recoveryzone"];

  // Collections that should have siteId (based on firestore.rules and firebase-collections.ts)
  const collectionsWithSiteId = [
    "members",
    "clubServices",
    "clubGeneralServices",
    "memberSubscriptions",
    "prices",
    "priceHistory",
    "events",
    "exercises",
    "member_assessments",
    "planner_sessions",
    "beep_test_results",
    "member_shadow_analytics",
    "training_attendance",
    "focus_tags",
    "member_declarations",
    "marketing_history",
    "business_trips",
    "trip_expenses",
    "annual_plans",
    "training_templates",
    "sales",
    "products",
    "inventoryEvents",
    "inventory",
    "finances",
    "client_packages",
    "clients",
    "reviews",
    "config",
    "sessions",
    "tournaments",
    "quizzes",
    "theory_results",
    "tournament_entries",
    "tournament_matches",
  ];

  const results: Record<string, { updated: number; skipped: number }> = {};

  for (const siteId of sites) {
    console.log(`\n{'='.repeat(60)}`);
    console.log(`SITE: ${siteId}`);
    console.log(`{'='.repeat(60)}`);

    for (const collectionName of collectionsWithSiteId) {
      try {
        const result = await migrateCollection(
          db,
          collectionName,
          siteId,
          dryRun
        );
        results[`${siteId}/${collectionName}`] = result;
      } catch (error) {
        console.error("  ERROR on collection:", collectionName, error);
        results[`${siteId}/${collectionName}`] = { updated: 0, skipped: 0 };
      }
    }
  }

  console.log("\n\n=== MIGRATION SUMMARY ===");
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const [key, result] of Object.entries(results)) {
    if (result.updated > 0) {
      console.log(
        `${key}: ${result.updated} updated, ${result.skipped} skipped`
      );
    }
    totalUpdated += result.updated;
    totalSkipped += result.skipped;
  }

  console.log(
    `\nTOTAL: ${totalUpdated} documents updated, ${totalSkipped} already had siteId`
  );
  console.log(
    `Mode: ${dryRun ? "DRY RUN - no changes made" : "LIVE - changes committed"}`
  );
}

main().catch(console.error);
