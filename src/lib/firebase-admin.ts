import * as admin from "firebase-admin";

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    if (!adminDb) adminDb = admin.firestore();
    if (!adminAuth) adminAuth = admin.auth();
    return;
  }

  // Prefer JSON from environment variable for security and portability
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      // Parse the JSON string from the environment variable
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(
        "Firebase Admin SDK initialized securely using FIREBASE_SERVICE_ACCOUNT_JSON."
      );
    } catch (error) {
      console.error(
        "CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON or initialize Firebase Admin SDK.",
        error
      );
      throw new Error(
        "The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not valid JSON."
      );
    }
  }
  // Fallback to the original method (for local file-based development)
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log(
        "Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS file path."
      );
    } catch (error) {
      console.error(
        "CRITICAL: Firebase Admin SDK initialization failed with GOOGLE_APPLICATION_CREDENTIALS!",
        error
      );
      throw error;
    }
  }
  // Fail fast if no credentials are provided
  else {
    throw new Error(
      "Firebase Admin SDK credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
    );
  }

  adminDb = admin.firestore();
  adminAuth = admin.auth();
}

// These getter functions ensure that Firebase is initialized only once.
const getAdminDb = () => {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  return adminDb;
};

const getAdminAuth = () => {
  if (!adminAuth) {
    initializeFirebaseAdmin();
  }
  return adminAuth;
};

export { getAdminDb, getAdminAuth };
