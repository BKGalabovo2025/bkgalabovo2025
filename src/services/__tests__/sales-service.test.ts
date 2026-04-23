import { describe, it, expect, vi, afterEach } from "vitest";
import { docToSale, hasMemberPaidForMonth } from "../sales-service";
import { DocumentSnapshot, getDocs } from "firebase/firestore";
import { Sale } from "@/types";

// Mock firebase collections
vi.mock("@/lib/firebase-collections", () => ({
  getSalesCollection: vi.fn(() => ({})), // Return a dummy object
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
    // Mock other functions like query, where, orderBy as simple pass-throughs
    // because we are controlling the final output of getDocs directly.
    query: vi.fn((_, ...constraints) => ({ constraints })),
    where: vi.fn((field) => ({ field })),
    orderBy: vi.fn((field) => ({ field })),
  };
});

// Mock DocumentSnapshot helper
const mockDoc = (id: string, data: Record<string, unknown>) =>
  ({
    id,
    exists: () => true,
    data: () => data,
  }) as unknown as DocumentSnapshot;

afterEach(() => {
  vi.clearAllMocks();
});

describe("sales-service", () => {
  describe("docToSale", () => {
    it("should return null if doc does not exist", () => {
      const doc = {
        id: "1",
        exists: () => false,
        data: () => ({}),
      } as DocumentSnapshot;
      expect(docToSale(doc)).toBeNull();
    });

    it("should parse valid sale data correctly", () => {
      const mockDate = new Date("2024-01-01T10:00:00Z");
      const data = {
        memberId: "m1",
        saleDate: { toDate: () => mockDate },
        items: [{ productId: "p1", name: "Item 1", quantity: 2, price: 10 }],
        status: "completed",
        currency: "EUR",
        totalAmount: 20,
        isPaid: true,
        subscriptionId: "s1",
      };

      const doc = mockDoc("sale1", data);
      const result = docToSale(doc);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("sale1");
    });
  });

  describe("hasMemberPaidForMonth", () => {
    const mockedGetDocs = getDocs as vi.Mock;

    it("should return true if a member has a subscription sale for the month", async () => {
      const mockSalesDocs = {
        docs: [
          mockDoc("sale1", {
            memberId: "member1",
            saleDate: { toDate: () => new Date("2024-01-15T10:00:00Z") },
            subscriptionId: "sub1",
          }),
        ],
      };
      mockedGetDocs.mockResolvedValue(mockSalesDocs);

      const result = await hasMemberPaidForMonth("member1", 2024, 1);
      expect(result).toBe(true);
    });

    it("should return false if a member has no sales for the month", async () => {
      const mockSalesDocs = {
        docs: [
          mockDoc("sale1", {
            memberId: "member1",
            saleDate: { toDate: () => new Date("2024-02-15T10:00:00Z") },
            subscriptionId: "sub1",
          }),
        ],
      };
      mockedGetDocs.mockResolvedValue(mockSalesDocs);

      const result = await hasMemberPaidForMonth("member1", 2024, 1);
      expect(result).toBe(false);
    });

    it("should return false if a member's sale is not for a subscription", async () => {
      const mockSalesDocs = {
        docs: [
          mockDoc("sale1", {
            memberId: "member1",
            saleDate: { toDate: () => new Date("2024-01-15T10:00:00Z") },
            subscriptionId: null, // Not a subscription sale
          }),
        ],
      };
      mockedGetDocs.mockResolvedValue(mockSalesDocs);

      const result = await hasMemberPaidForMonth("member1", 2024, 1);
      expect(result).toBe(false);
    });

    it("should return false when there are no sales for the member", async () => {
      const mockSalesDocs = { docs: [] }; // No documents returned
      mockedGetDocs.mockResolvedValue(mockSalesDocs);

      const result = await hasMemberPaidForMonth("member1", 2024, 1);
      expect(result).toBe(false);
    });
  });
});
