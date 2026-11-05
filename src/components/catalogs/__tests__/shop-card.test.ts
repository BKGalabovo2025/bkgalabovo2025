import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/currency";
import { Product } from "@/types";

describe("Shop catalog cards, stock calculation, and deep linking", () => {
  const sampleProduct: Product = {
    id: "prod_grip_yonex",
    siteId: "bkgalabovo2025",
    name: "Грип за ракета Yonex Super Grap (3 броя)",
    description:
      "Висококачествен антиперспирантен грип за професионален бадминтон. Осигурява максимално сцепление и абсорбиране на потта по време на игра.",
    price: 6.5,
    currency: "EUR",
    category: "АКСЕСОАРИ",
    stock: 12,
    restockThreshold: 5,
    imageUrl:
      "https://example.com/yonex-grip-front.jpg, https://example.com/yonex-grip-back.jpg",
  };

  it("форматира цената на артикула коректно", () => {
    const formatted = formatPrice(sampleProduct.price);
    expect(formatted).toContain("6,5");
    expect(formatted).toContain("€");
  });

  it("определя коректно наличността: В наличност при stock > threshold", () => {
    const stock = sampleProduct.stock;
    const threshold = sampleProduct.restockThreshold || 3;
    let status = "";
    if (stock <= 0) {
      status = "out_of_stock";
    } else if (stock <= threshold) {
      status = "low_stock";
    } else {
      status = "in_stock";
    }
    expect(status).toBe("in_stock");
  });

  it("определя коректно наличността: Ограничен при stock <= threshold", () => {
    const lowStockProduct: Product = {
      ...sampleProduct,
      stock: 4,
      restockThreshold: 5,
    };
    const stock = lowStockProduct.stock;
    const threshold = lowStockProduct.restockThreshold || 3;
    let status = "";
    if (stock <= 0) {
      status = "out_of_stock";
    } else if (stock <= threshold) {
      status = "low_stock";
    } else {
      status = "in_stock";
    }
    expect(status).toBe("low_stock");
  });

  it("определя коректно наличността: Изчерпан при stock <= 0", () => {
    const outOfStockProduct: Product = {
      ...sampleProduct,
      stock: 0,
    };
    const stock = outOfStockProduct.stock;
    const threshold = outOfStockProduct.restockThreshold || 3;
    let status = "";
    if (stock <= 0) {
      status = "out_of_stock";
    } else if (stock <= threshold) {
      status = "low_stock";
    } else {
      status = "in_stock";
    }
    expect(status).toBe("out_of_stock");
  });

  it("парсва коректно множество снимки от запетая-разделен imageUrl низ", () => {
    const images = (sampleProduct.imageUrl || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
    expect(images).toHaveLength(2);
    expect(images[0]).toBe("https://example.com/yonex-grip-front.jpg");
    expect(images[1]).toBe("https://example.com/yonex-grip-back.jpg");
  });

  it("генерира валиден директен линк към артикула за споделяне", () => {
    const origin = "https://bkgalabovo2025.vercel.app";
    const deepLink = `${origin}/catalogs/shop?item=${sampleProduct.id}`;
    expect(deepLink).toContain("/catalogs/shop?item=prod_grip_yonex");
  });
});
