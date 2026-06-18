import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Runtime validation for development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value && key !== "measurementId")
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error(
      `❌ Firebase config is missing keys: ${missingKeys.join(", ")}`
    );
    console.log(
      "Current config values (keys only):",
      Object.keys(firebaseConfig).reduce(
        (acc, key) => ({
          ...acc,
          [key]: firebaseConfig[key as keyof typeof firebaseConfig]
            ? "SET"
            : "MISSING",
        }),
        {}
      )
    );
  }
}

// Initialize Firebase
const isTestEnv =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV === "test" || process.env.VITEST === "true");

const app = (() => {
  if (isTestEnv) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {} as any;
  }
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = isTestEnv ? ({} as any) : getFirestore(app);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const auth = isTestEnv ? ({} as any) : getAuth(app);

// Connect to emulators in development if requested
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
) {
  const authEmulatorHost =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
  const firestoreEmulatorHost =
    process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST ||
    "localhost:8081";

  // Using a global variable to ensure we only connect once during HMR
  const g = window as unknown as { _firebaseEmulatorsConnected?: boolean };
  if (!g._firebaseEmulatorsConnected) {
    try {
      const { connectAuthEmulator } = await import("firebase/auth");
      const { connectFirestoreEmulator } = await import("firebase/firestore");

      connectAuthEmulator(auth, `http://${authEmulatorHost}`, {
        disableWarnings: true,
      });

      const [fsHost, fsPort] = firestoreEmulatorHost.split(":");
      connectFirestoreEmulator(db, fsHost, parseInt(fsPort || "8081"));

      g._firebaseEmulatorsConnected = true;
      console.log("🚀 Connected to Firebase Emulators");
    } catch (e) {
      console.warn("⚠️ Could not connect to Firebase Emulators:", e);
    }
  }
}

// For backwards compatibility and convenience
const getDb = () => db;
const getFirebaseAuth = () => auth;

export { db, getDb, getFirebaseAuth };
