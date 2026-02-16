import * as admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let serviceAccount: any; // Use `any` to avoid type conflicts with the snake_case properties.

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
  // Provide a clear error if parsing fails.
  throw new Error(
    `CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Reason: ${e.message}. This is often caused by newlines in the .env.local file. Ensure the entire JSON object is on a single line.`
  );
}

// Step 3: Validate the Parsed Object using the correct snake_case properties.
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error(
      'CRITICAL: The parsed service account JSON is missing one or more required properties (project_id, private_key, client_email). The JSON may be incomplete or corrupted.'
    );
}

// Step 4: Initialize the App (if not already done)
if (!getApps().length) {
  initializeApp({
    // The cert function correctly handles the snake_case properties.
    credential: admin.credential.cert(serviceAccount),
  });
}

// Initialize and export the admin instances for use in other server-side files.
const adminDb = getFirestore();
const adminAuth = getAuth();

export { adminDb, adminAuth };
