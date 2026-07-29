import { vi } from "vitest";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

// Allow Server Actions to be imported in vitest
vi.mock("server-only", () => ({}));

// Initialize Test Environment to bypass security rules
const testEnv = await initializeTestEnvironment({
  projectId: "bkgalabovo-test",
  firestore: { host: "127.0.0.1", port: 8081 },
});

// Create an authenticated context with admin privileges
const authContext = testEnv.authenticatedContext("admin-user", {
  admin: true,
  allowedSites: { bkgalabovo: true, recoveryzone: true },
});

export const db = authContext.firestore();

// Mock the app's firebase configuration to return our emulator-connected db
vi.mock("@/lib/firebase", () => ({
  db,
  getDb: () => db,
  getFirebaseAuth: () => ({}), // not testing auth right now
}));

export const clearFirestore = async () => {
  try {
    await testEnv.clearFirestore();
  } catch (err) {
    console.error("Error clearing Firestore emulator:", err);
  }
};
