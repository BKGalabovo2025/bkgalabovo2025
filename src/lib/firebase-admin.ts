// --- Vercel Environment Variable Debugging ---
console.log("--- Vercel Build-Time Environment Variables ---");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("VERCEL_ENV:", process.env.VERCEL_ENV);
console.log("Attempting to read FIREBASE_SERVICE_ACCOUNT_JSON...");
const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (serviceAccountJSON) {
    console.log("FIREBASE_SERVICE_ACCOUNT_JSON variable WAS FOUND.");
    console.log("First 50 chars:", serviceAccountJSON.substring(0, 50));
} else {
    console.log("CRITICAL_DEBUG: FIREBASE_SERVICE_ACCOUNT_JSON was NOT FOUND in process.env.");
}
console.log("------------------------------------------");
// --- End Debugging ---

import * as admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let serviceAccount: admin.ServiceAccount;

// Step 1: Verify the Environment Variable Exists
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error(
    'CRITICAL: The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. The Admin SDK cannot be initialized. Check your .env.local file or hosting provider configuration.'
  );
}

try {
  // Step 2: Parse the JSON string.
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (e: any) {
  throw new Error(
    `CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Reason: ${e.message}. This is often caused by newlines in the .env.local file. Ensure the entire JSON object is on a single line.`
  );
}

// Step 3: Validate the Parsed Object
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error(
      'CRITICAL: The parsed service account JSON is missing one or more required properties (project_id, private_key, client_email). The JSON may be incomplete or corrupted.'
    );
}

// Step 4: Initialize the App (if not already done)
if (!getApps().length) {
  initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export { adminDb, adminAuth };