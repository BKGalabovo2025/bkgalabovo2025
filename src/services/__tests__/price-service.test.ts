import { describe, it, expect, vi, beforeEach } from "vitest";
import * as priceService from "../price-service";
import * as firestore from "firebase/firestore";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getDocs: vi.fn(),
    doc: vi.fn((_, id) => ({ id: id || "mock-doc-id" })),
    writeBatch: vi.fn(() => ({
      update: vi.fn(),
      set: vi.fn(),
      commit: vi.fn(),
    })),
    getDoc: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    where: vi.fn(),
  };
});

vi.mock("@/lib/firebase-collections", () => ({
  getPricesCollection: vi.fn(),
  getPricesQuery: vi.fn(),
  getPriceHistoryCollection: vi.fn(),
  getPriceHistoryQuery: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/config/sites", () => ({
  getSiteConfig: vi.fn(() => ({ id: "site1" })),
}));

describe("priceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllPrices should map and return prices", async () => {
    const mockSnap = {
      docs: [
        {
          id: "p1",
          data: () => ({ name: "Test Price", value: 100, isActive: true }),
        },
      ],
    };
    vi.mocked(firestore.getDocs).mockResolvedValue(mockSnap as any);

    const prices = await priceService.getAllPrices();
    expect(prices).toHaveLength(1);
    expect(prices[0].name).toBe("Test Price");
    expect(prices[0].value).toBe(100);
  });

  it("updatePrice should update price and create history entry", async () => {
    const mockBatch = { update: vi.fn(), set: vi.fn(), commit: vi.fn() };
    vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);
    
    vi.mocked(firestore.getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ value: 50 }),
    } as any);

    const mockUser = { uid: "user1", email: "test@test.com" };

    await priceService.updatePrice("p1", 75, mockUser as any, "Test Update");

    expect(mockBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1" }),
      expect.objectContaining({ value: 75 })
    );

    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.objectContaining({ id: "mock-doc-id" }), // history doc
      expect.objectContaining({
        priceId: "p1",
        oldValue: 50,
        newValue: 75,
        userId: "user1",
        notes: "Test Update"
      })
    );

    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it("updatePrice should throw if price does not exist", async () => {
    const mockBatch = { update: vi.fn(), set: vi.fn(), commit: vi.fn() };
    vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);
    
    vi.mocked(firestore.getDoc).mockResolvedValue({
      exists: () => false,
      data: () => undefined,
    } as any);

    const mockUser = { uid: "user1" };

    await expect(priceService.updatePrice("p1", 75, mockUser as any)).rejects.toThrow();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
