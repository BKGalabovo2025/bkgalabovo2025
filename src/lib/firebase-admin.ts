
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    if(!adminDb) adminDb = admin.firestore();
    if(!adminAuth) adminAuth = admin.auth();
    return;
  }

  // Ensure the service account details are provided
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    throw new Error('Missing Firebase Admin SDK credentials in environment variables.');
  }

  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    // Replace escaped newlines before parsing
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminDb = admin.firestore();
    adminAuth = admin.auth();
  } catch (error) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed!', error);
    // Re-throw the error to fail fast during initialization
    throw error;
  }
}

// These are now functions that will initialize on first call.
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
