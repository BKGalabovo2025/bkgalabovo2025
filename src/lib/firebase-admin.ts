
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

function initializeFirebaseAdmin() {
  // If the app is already initialized, return the existing instances.
  if (admin.apps.length > 0) {
    if(!adminDb) adminDb = admin.firestore();
    if(!adminAuth) adminAuth = admin.auth();
    return;
  }

  // Check for the environment variable that points to the service account file.
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. ' +
      'It should point to the path of the service account JSON file.'
    );
  }

  try {
    // Initialize the Admin SDK using the service account file.
    // This is the recommended method for server environments.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    adminDb = admin.firestore();
    adminAuth = admin.auth();
  } catch (error) {
    console.error('CRITICAL: Firebase Admin SDK initialization failed!', error);
    // Re-throw the error to fail fast during initialization.
    throw error;
  }
}

// These functions ensure that Firebase is initialized only once.
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
