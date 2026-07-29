import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { vi } from "vitest";

// Initialize a real Firebase app pointing to the emulator for tests
const app = initializeApp({ projectId: "bkgalabovo-test" });
export const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8081);

// Mock the app's firebase configuration to return our emulator-connected db
vi.mock("@/lib/firebase", () => ({
  db,
  getDb: () => db,
  getFirebaseAuth: () => ({}), // not testing auth right now
}));

export const clearFirestore = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8081/emulator/v1/projects/bkgalabovo-test/databases/(default)/documents",
      { method: "DELETE" }
    );
    if (!response.ok) {
      console.error("Failed to clear Firestore emulator");
    }
  } catch (err) {
    console.error("Error clearing Firestore emulator:", err);
  }
};
