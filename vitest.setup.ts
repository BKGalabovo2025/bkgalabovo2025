import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Create mock references to be returned by collection() and doc()
const mockCollectionRef = { path: "mock-collection" } as any;
const mockDocRef = { id: "mock-doc" } as any;

vi.mock("firebase/firestore", async () => {
  const firestore =
    await vi.importActual<typeof import("firebase/firestore")>(
      "firebase/firestore"
    );
  return {
    ...firestore,
    getFirestore: vi.fn(() => ({})),
    // Mock collection to return a specific reference
    collection: vi.fn(() => mockCollectionRef),
    // Mock doc to return a specific reference
    doc: vi.fn(() => mockDocRef),
    getDoc: vi.fn(() =>
      Promise.resolve({ exists: () => true, data: () => ({}) })
    ),
    getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
    addDoc: vi.fn(() => Promise.resolve({ id: "123" })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    serverTimestamp: vi.fn(() => firestore.serverTimestamp()),
    Timestamp: firestore.Timestamp,
  };
});

vi.mock("@/lib/firebase", () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock("@/lib/firebase-collections", () => ({
  membersCollection: { path: "members" },
  salesCollection: { path: "sales" },
}));

// Polyfill ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
