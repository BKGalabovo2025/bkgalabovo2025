import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getDashboardStats, getRevenueTrendData } from "../dashboard-service";

describe("dashboardService", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    // 15 August 2026
    vi.setSystemTime(new Date("2026-08-15T12:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("getDashboardStats", () => {
    it("should calculate correct stats for empty inputs", () => {
      const stats = getDashboardStats([], [], []);
      expect(stats.totalMembers).toBe(0);
      expect(stats.activeMembersCount).toBe(0);
      expect(stats.totalRevenue).toEqual({});
      expect(stats.revenueLast30Days).toBe(0);
      expect(stats.revenueChange).toBe(0);
      expect(stats.newMembersChange).toBe(0);
    });

    it("should calculate correct stats with data", () => {
      const members = [
        { status: "active", registrationDate: "2026-08-10" },
        { status: "inactive", registrationDate: "2026-07-01" },
        { status: "active", registrationDate: "2026-06-01" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[];

      const sales = [
        {
          status: "completed",
          isPaid: true,
          type: "service",
          totalAmount: 100,
          currency: "EUR",
          saleDate: "2026-08-10",
        },
        {
          status: "completed",
          isPaid: true,
          type: "service",
          totalAmount: 50,
          currency: "EUR",
          saleDate: "2026-07-10",
        }, // previous 30 days
        {
          status: "completed",
          isPaid: true,
          type: "service",
          totalAmount: 200,
          currency: "BGN",
          saleDate: "2026-08-01",
        },
        {
          status: "pending",
          isPaid: false,
          type: "service",
          totalAmount: 10,
          currency: "EUR",
          saleDate: "2026-08-12",
        }, // unpaid
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[];

      const stats = getDashboardStats(
        members,
        sales,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [{ id: "p1" } as any],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [{} as any, {} as any]
      );

      expect(stats.totalMembers).toBe(3);
      expect(stats.activeMembersCount).toBe(2);
      expect(stats.unpaidSales).toBe(1);
      expect(stats.lowStockCount).toBe(1);
      expect(stats.trainingsToday).toBe(2);

      // Revenue Last 30 Days (from 2026-07-16 to 2026-08-15)
      // 100 EUR + 200 BGN = 300
      expect(stats.revenueLast30Days).toBe(300);
      // Previous 30 days: 50
      expect(stats.revenueChange).toBe(((300 - 50) / 50) * 100);

      // Members
      expect(stats.newMembersLast30Days).toBe(1); // 2026-08-10
    });
  });

  describe("getRevenueTrendData", () => {
    it("should return last 6 months data", () => {
      const sales = [
        {
          status: "completed",
          isPaid: true,
          type: "service",
          totalAmount: 100,
          saleDate: "2026-08-10",
        },
        {
          status: "completed",
          isPaid: true,
          type: "service",
          totalAmount: 50,
          saleDate: "2026-07-10",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[];

      const trends = getRevenueTrendData(sales);
      expect(trends).toHaveLength(6);

      const augName = new Date("2026-08-01").toLocaleString("default", {
        month: "short",
      });
      const julName = new Date("2026-07-01").toLocaleString("default", {
        month: "short",
      });

      const aug = trends.find((t) => t.name === augName);
      const jul = trends.find((t) => t.name === julName);

      expect(aug?.revenue).toBe(100);
      expect(jul?.revenue).toBe(50);
    });
  });
});
