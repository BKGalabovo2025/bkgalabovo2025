import { DocumentSnapshot, getDocs } from "firebase/firestore";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";

import { getAllClubServices } from "../club-service";

// Mock firebase collections
vi.mock("@/lib/firebase-collections", () => ({
  getClubServicesCollection: vi.fn(() => ({})),
}));

// Mock firestore functions
vi.mock("firebase/firestore", async () => {
  const firestore =
    await vi.importActual<typeof import("firebase/firestore")>(
      "firebase/firestore"
    );
  return {
    ...firestore,
    getDocs: vi.fn(),
  };
});

const mockDoc = (id: string, data: Record<string, unknown>) =>
  ({
    id,
    exists: () => true,
    data: () => data,
  }) as unknown as DocumentSnapshot;

afterEach(() => {
  vi.clearAllMocks();
});

describe("club-service", () => {
  describe("getAllClubServices", () => {
    const mockedGetDocs = getDocs as Mock;

    it("should fetch all club services successfully", async () => {
      const mockServicesDocs = {
        docs: [
          mockDoc("service-1", {
            name: "Индивидуална тренировка",
            price: 40,
            currency: "EUR",
            siteId: "bkgalabovo",
          }),
          mockDoc("service-2", {
            name: "Възстановяване Normatec",
            price: 15,
            currency: "EUR",
            siteId: "recoveryzone",
          }),
        ],
      };
      mockedGetDocs.mockResolvedValue(mockServicesDocs);

      const result = await getAllClubServices();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("service-1");
      expect(result[0].name).toBe("Индивидуална тренировка");
      expect(result[1].id).toBe("service-2");
      expect(result[1].name).toBe("Възстановяване Normatec");
    });

    it("should return an empty array if getDocs fails", async () => {
      mockedGetDocs.mockRejectedValue(new Error("Firebase read failed"));

      const result = await getAllClubServices();
      expect(result).toEqual([]);
    });
  });
});
