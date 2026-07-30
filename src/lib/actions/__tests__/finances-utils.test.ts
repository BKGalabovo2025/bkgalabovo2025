import { describe, expect, it } from "vitest";

import type { Sale } from "@/types";

import { calculateFinancesOverview } from "../finances-utils";

describe("finances-utils", () => {
  it("calculates overview for paid sales and ignores cancelled or unpaid records", () => {
    const today = new Date();
    const saleDate = today.toISOString();

    const sales: Sale[] = [
      {
        id: "sale-1",
        saleDate,
        status: "completed",
        isPaid: true,
        totalAmount: 100,
        items: [
          { productId: "p1", name: "Абонамент", quantity: 1, price: 100 },
        ],
      },
      {
        id: "sale-2",
        saleDate,
        status: "completed",
        isPaid: true,
        totalAmount: 50,
        items: [
          { productId: "p2", name: "Възстановяване", quantity: 1, price: 50 },
        ],
      },
      {
        id: "sale-3",
        saleDate,
        status: "cancelled",
        isPaid: true,
        totalAmount: 200,
        items: [{ productId: "p3", name: "Магазин", quantity: 1, price: 200 }],
      },
      {
        id: "sale-4",
        saleDate,
        status: "completed",
        isPaid: false,
        totalAmount: 75,
        items: [{ productId: "p4", name: "Други", quantity: 1, price: 75 }],
      },
    ] as Sale[];

    const overview = calculateFinancesOverview(sales, "bkgalabovo");

    expect(overview.totalRevenue).toBe(150);
    expect(overview.transactionCount).toBe(2);
    expect(overview.averageTransactionValue).toBe(75);
    expect(overview.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Други услуги", value: 100 }),
        expect.objectContaining({ name: "Възстановяване", value: 50 }),
      ])
    );
    expect(overview.dailyTrend).toHaveLength(30);
    expect(overview.dailyTrend.some((item) => item.amount === 150)).toBe(true);
  });

  it("uses recovery zone colors when activeBranch is recoveryzone", () => {
    const today = new Date().toISOString();
    const sales: Sale[] = [
      {
        id: "sale-1",
        saleDate: today,
        status: "completed",
        isPaid: true,
        totalAmount: 100,
        items: [
          { productId: "p1", name: "Нещо друго", quantity: 1, price: 100 },
        ],
      },
    ] as Sale[];

    const overview = calculateFinancesOverview(sales, "recoveryzone");

    expect(overview.categories).toEqual([
      expect.objectContaining({
        name: "Други услуги",
        value: 100,
        color: "#f59e0b",
      }),
    ]);
  });
});
