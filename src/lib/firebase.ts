import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const isEmulatorMode =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    (isEmulatorMode ? "demo-api-key" : undefined),
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    (isEmulatorMode ? "bkgalabovo-test.firebaseapp.com" : undefined),
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    (isEmulatorMode ? "bkgalabovo-test" : undefined),
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (isEmulatorMode ? "bkgalabovo-test.appspot.com" : undefined),
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    (isEmulatorMode ? "123456789012" : undefined),
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    (isEmulatorMode ? "1:123456789012:web:abcdef" : undefined),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Runtime validation for development (skip in emulator mode)
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  !isEmulatorMode
) {
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
  typeof window === "undefined" &&
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

const globalObj =
  typeof window !== "undefined"
    ? (window as unknown as { _firebaseDb?: Firestore })
    : (globalThis as unknown as { _firebaseDb?: Firestore });

let db: Firestore;

if (isTestEnv) {
  db = {} as unknown as Firestore;
} else if (globalObj._firebaseDb) {
  db = globalObj._firebaseDb;
} else {
  try {
    // Try to initialize with offline persistence
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (err) {
    // Fallback if initializeFirestore fails or was already called
    console.error(
      "Failed to initialize Firestore with persistence. Falling back to default:",
      err
    );
    db = getFirestore(app);
  }
  globalObj._firebaseDb = db;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const auth = isTestEnv ? ({} as any) : getAuth(app);

if (typeof window !== "undefined" && !isTestEnv) {
  import("firebase/auth").then(
    ({ setPersistence, browserLocalPersistence }) => {
      setPersistence(auth, browserLocalPersistence).catch(() => {});
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const storage = isTestEnv ? ({} as any) : getStorage(app);

// Connect to emulators in development or test if requested
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
) {
  const authEmulatorHost =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  const firestoreEmulatorHost =
    process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST ||
    "127.0.0.1:8081";

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
    } catch (e: unknown) {
      console.warn("⚠️ Could not connect to Firebase Emulators:", e);
    }
  }
}

// For backwards compatibility and convenience
const getDb = () => db;
const getFirebaseAuth = () => auth;

export { db, getDb, getFirebaseAuth, storage };
