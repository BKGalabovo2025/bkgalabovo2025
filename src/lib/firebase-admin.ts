import * as admin from "firebase-admin";

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;
let adminStorage: admin.storage.Storage;

function initializeFirebaseAdmin() {
  if (admin.apps && admin.apps.length > 0) {
    if (!adminDb) adminDb = admin.firestore();
    if (!adminAuth) adminAuth = admin.auth();
    if (!adminStorage) adminStorage = admin.storage();
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // Resolve admin object ESM default wrapper if necessary
  const resolvedAdmin: any = (admin as any).default || admin;

  try {
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(
            /\\n/g,
            "\n"
          );
        }
        resolvedAdmin.initializeApp({
          credential: resolvedAdmin.credential.cert(serviceAccount),
          storageBucket:
            process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
            "bkgalabovo2025.firebasestorage.app",
        });
        console.log(
          "Firebase Admin SDK initialized using FIREBASE_SERVICE_ACCOUNT_JSON."
        );
      } catch (parseError) {
        console.warn(
          "WARNING: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, trying fallback credentials.",
          parseError
        );
        throw parseError;
      }
    } else if (
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      resolvedAdmin.initializeApp({
        credential: resolvedAdmin.credential.cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        storageBucket:
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          "bkgalabovo2025.firebasestorage.app",
      });
      console.log(
        "Firebase Admin SDK initialized using individual environment variables."
      );
    } else if (googleCreds) {
      resolvedAdmin.initializeApp({
        credential: resolvedAdmin.credential.applicationDefault(),
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

    adminDb = resolvedAdmin.firestore();
    adminAuth = resolvedAdmin.auth();
    adminStorage = resolvedAdmin.storage();
  } catch (error) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed.", error);
  }
}

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

const getAdminStorage = () => {
  if (!adminStorage) {
    initializeFirebaseAdmin();
  }
  if (!adminStorage) {
    throw new Error(
      "Firebase Admin Storage is not initialized. Check your credentials."
    );
  }
  return adminStorage;
};

export { getAdminDb, getAdminAuth, getAdminStorage, initializeFirebaseAdmin };
