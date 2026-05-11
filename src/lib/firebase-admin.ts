import * as admin from "firebase-admin";

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    if (!adminDb) adminDb = admin.firestore();
    if (!adminAuth) adminAuth = admin.auth();
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    if (serviceAccountJson) {
      try {
        // Replace literal \n in private_key with real newlines before parsing
        const sanitized = serviceAccountJson.replace(/\\n/g, "\n");
        const serviceAccount = JSON.parse(sanitized);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log(
          "Firebase Admin SDK initialized using FIREBASE_SERVICE_ACCOUNT_JSON."
        );
      } catch (parseError) {
        // JSON parse failed (e.g., corrupted key) - fall through to next method
        console.warn(
          "WARNING: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, trying fallback credentials.",
          parseError
        );
        throw parseError; // re-throw to outer catch so we skip the rest
      }
    } else if (
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      // Fallback to individual environment variables (easier to manage in Vercel)
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId:
            process.env.FIREBASE_PROJECT_ID ||
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log(
        "Firebase Admin SDK initialized using individual environment variables."
      );
    } else if (googleCreds) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log(
        "Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS."
      );
    } else {
      console.warn(
        "WARNING: Firebase Admin SDK credentials not found. Server-side Firebase Admin features will fail."
      );
      return;
    }

    adminDb = admin.firestore();
    adminAuth = admin.auth();
  } catch (error) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed.", error);
    // We don't throw here to avoid top-level module evaluation crashes
  }
}

// These getter functions ensure that Firebase is initialized only once.
const getAdminDb = () => {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  if (!adminDb) {
    throw new Error(
      "Firebase Admin Firestore is not initialized. Check your credentials."
    );
  }
  return adminDb;
};

const getAdminAuth = () => {
  if (!adminAuth) {
    initializeFirebaseAdmin();
  }
  if (!adminAuth) {
    throw new Error(
      "Firebase Admin Auth is not initialized. Check your credentials."
    );
  }
  return adminAuth;
};

export { getAdminDb, getAdminAuth, initializeFirebaseAdmin };
