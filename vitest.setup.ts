import "@testing-library/jest-dom";

import { CollectionReference, DocumentReference } from "firebase/firestore";
import { vi } from "vitest";

// Allow Server Actions to be imported in vitest (server-only guard is a no-op in tests)
vi.mock("server-only", () => ({}));

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
const mockCollectionRef = {
  path: "mock-collection",
} as unknown as CollectionReference;
const mockDocRef = { id: "mock-doc" } as unknown as DocumentReference;

vi.mock("firebase/firestore", async () => {
  const firestore =
    await vi.importActual<typeof import("firebase/firestore")>(
      "firebase/firestore"
    );
  return {
    ...firestore,
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(() => mockCollectionRef),
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

// Default Mock for Firebase Admin SDK in JSDOM / unit tests
vi.mock("@/lib/firebase-admin", () => {
  const createMockDoc = (id = "mock-doc-id") => ({
    id,
    exists: true,
    data: vi.fn(() => ({
      name: "БК Гълъбово",
      hallName: "Спортна зала",
      address: "Гълъбово",
    })),
    get: vi.fn(() =>
      Promise.resolve({
        id,
        exists: true,
        data: () => ({
          name: "БК Гълъбово",
          hallName: "Спортна зала",
          address: "Гълъбово",
        }),
      })
    ),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  });

  const createMockCollection = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const col: any = {
      doc: vi.fn((id) => createMockDoc(id)),
      get: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
      add: vi.fn(() => Promise.resolve({ id: "mock-new-id" })),
      where: vi.fn(() => col),
      orderBy: vi.fn(() => col),
      limit: vi.fn(() => col),
    };
    return col;
  };

  const mockDb = {
    collection: vi.fn(() => createMockCollection()),
    doc: vi.fn((path?: string) => createMockDoc(path?.split("/").pop())),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    })),
    runTransaction: vi.fn((fn: (txn: unknown) => unknown) =>
      fn({
        get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })
    ),
  };

  return {
    getAdminDb: vi.fn(() => mockDb),
    getAdminAuth: vi.fn(() => ({
      verifyIdToken: vi.fn(() =>
        Promise.resolve({
          uid: "admin-uid",
          email: "admin@bkgalabovo.com",
          admin: true,
        })
      ),
    })),
    getAdminStorage: vi.fn(() => ({
      bucket: vi.fn(() => ({
        file: vi.fn(() => ({
          save: vi.fn(() => Promise.resolve()),
          delete: vi.fn(() => Promise.resolve()),
          getSignedUrl: vi.fn(() => Promise.resolve(["https://mock-url"])),
        })),
      })),
    })),
  };
});

// Polyfill ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill HTMLMediaElement methods for JSDOM
if (typeof window !== "undefined" && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = vi
    .fn()
    .mockImplementation(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = vi
    .fn()
    .mockImplementation(() => {});
  window.HTMLMediaElement.prototype.load = vi.fn().mockImplementation(() => {});
}

// Mock localStorage to prevent JSDOM warning
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
} as unknown as Storage;
