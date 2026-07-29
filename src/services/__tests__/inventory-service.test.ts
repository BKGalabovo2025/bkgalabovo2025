import { describe, it, expect } from "vitest";
import { docToProduct } from "../inventory-service";

describe("inventoryService", () => {
  describe("docToProduct", () => {
    it("should return null for invalid snapshot", () => {
      const mockDoc = {
        id: "",
        exists: () => false,
      };
      expect(
        docToProduct(mockDoc as unknown as Parameters<typeof docToProduct>[0])
      ).toBeNull();
    });

    it("should return null if product name is missing", () => {
      const mockDoc = {
        id: "p1",
        exists: () => true,
        data: () => ({ price: 10 }), // missing name
      };
      expect(
        docToProduct(mockDoc as unknown as Parameters<typeof docToProduct>[0])
      ).toBeNull();
    });

    it("should map valid product correctly", () => {
      const mockDoc = {
        id: "p1",
        exists: () => true,
        data: () => ({
          name: "Water",
          price: 2,
          stock: 50,
          category: "Drinks",
          restockThreshold: 10,
        }),
      };

      const product = docToProduct(
        mockDoc as unknown as Parameters<typeof docToProduct>[0]
      );
      expect(product).not.toBeNull();
      expect(product?.name).toBe("Water");
      expect(product?.stock).toBe(50);
      expect(product?.restockThreshold).toBe(10);
      expect(product?.currency).toBe("EUR");
    });
  });
});
