
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// --- Functions to get Firebase services ---

// This function ensures the app is initialized only once.
function getFirebaseApp(): FirebaseApp {
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

// Returns the Auth instance.
function getFirebaseAuth(): Auth {
    return getAuth(getFirebaseApp());
}

// Returns the Firestore instance.
function getDb(): Firestore {
    return getFirestore(getFirebaseApp());
}

// Returns the Storage instance.
function getAppStorage(): FirebaseStorage {
    return getStorage(getFirebaseApp());
}

// --- Exports ---

// We export the functions instead of the instances themselves.
export {
    getFirebaseApp,
    getFirebaseAuth,
    getDb,
    getAppStorage
};
