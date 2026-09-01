import { describe, expect, it } from "vitest";

import { calculateFinancesOverview } from "../lib/actions/finances-utils";
import { Sale } from "../types";

describe("Financial Precision & Math Edge Cases", () => {
  it("should accurately sum floating point revenues without binary floating-point errors", () => {
    const microSales: Sale[] = [
      {
        id: "s1",
        siteId: "bkgalabovo",
        memberId: "mem_1",
        saleDate: "2026-02-01T10:00:00.000Z",
        totalAmount: 19.99,
        currency: "EUR",
        isPaid: true,
        status: "completed",
        type: "inventory",
        items: [
          {
            productId: "p1",
            name: "Минерална вода",
            quantity: 1,
            price: 19.99,
          },
        ],
      },
      {
        id: "s2",
        siteId: "bkgalabovo",
        memberId: "mem_1",
        saleDate: "2026-02-05T10:00:00.000Z",
        totalAmount: 0.01,
        currency: "EUR",
        isPaid: true,
        status: "completed",
        type: "inventory",
        items: [{ productId: "p2", name: "Перо", quantity: 1, price: 0.01 }],
      },
      {
        id: "s3",
        siteId: "bkgalabovo",
        memberId: "mem_1",
        saleDate: "2026-02-28T10:00:00.000Z",
        totalAmount: 30.0,
        currency: "EUR",
        isPaid: true,
        status: "completed",
        type: "general_service",
        items: [
          { productId: "p3", name: "Сауна сесия", quantity: 1, price: 30.0 },
        ],
      },
    ];

    const result = calculateFinancesOverview(microSales, "bkgalabovo");
    expect(result.totalRevenue).toBe(50.0);
    expect(result.transactionCount).toBe(3);
    expect(result.averageTransactionValue).toBeCloseTo(16.67, 2);
  });

  it("should ignore unpaid or non-completed transactions in revenue calculation", () => {
    const mixedSales: Sale[] = [
      {
        id: "s_paid",
        siteId: "bkgalabovo",
        memberId: "mem_1",
        saleDate: "2026-02-01T10:00:00.000Z",
        totalAmount: 50.0,
        currency: "EUR",
        isPaid: true,
        status: "completed",
        type: "general_service",
        items: [{ productId: "p1", name: "Услуга", quantity: 1, price: 50.0 }],
      },
      {
        id: "s_pending",
        siteId: "bkgalabovo",
        memberId: "mem_1",
        saleDate: "2026-02-02T10:00:00.000Z",
        totalAmount: 100.0,
        currency: "EUR",
        isPaid: false,
        status: "pending",
        type: "general_service",
        items: [{ productId: "p2", name: "Услуга", quantity: 1, price: 100.0 }],
      },
    ];

    const result = calculateFinancesOverview(mixedSales, "bkgalabovo");
    expect(result.totalRevenue).toBe(50.0);
    expect(result.transactionCount).toBe(1);
  });

  it("should return zero revenue and empty state placeholder for empty sales list", () => {
    const result = calculateFinancesOverview([], "bkgalabovo");
    expect(result.totalRevenue).toBe(0);
    expect(result.transactionCount).toBe(0);
    expect(result.averageTransactionValue).toBe(0);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe("Няма продажби");
  });
});
