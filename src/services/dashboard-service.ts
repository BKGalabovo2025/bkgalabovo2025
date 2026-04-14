import { Member, Sale } from "@/types";

export type TotalRevenue = {
  [key: string]: number; // e.g. { EUR: 50.00 }
};

/**
 * Calculates comprehensive dashboard statistics with 30-day trends.
 * This function is defensively coded to handle any data shape without crashing.
 * @param members - An array of all members.
 * @param sales - An array of all sales.
 * @returns An object containing calculated dashboard statistics, including 30-day trends.
 */
export const getDashboardStats = (members: Member[], sales: Sale[]) => {
  const safeMembers = Array.isArray(members) ? members : [];
  const safeSales = Array.isArray(sales) ? sales : [];

  // --- Basic Stats ---
  const totalMembers = safeMembers.length;
  const activeMembersCount = safeMembers.filter(
    (m) => m && m.status === "active"
  ).length;
  const unpaidSales = safeSales.filter(
    (sale) => sale && sale.status !== "completed"
  ).length;

  // --- Date Ranges for Trend Analysis ---
  const now = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
  const sixtyDaysAgo = new Date(new Date().setDate(now.getDate() - 60));

  // --- Sales Analysis ---
  const salesLast30Days = safeSales.filter(
    (s) => s && new Date(s.saleDate) >= thirtyDaysAgo
  );
  const sales30To60DaysAgo = safeSales.filter(
    (s) =>
      s &&
      new Date(s.saleDate) >= sixtyDaysAgo &&
      new Date(s.saleDate) < thirtyDaysAgo
  );

  const salesCountLast30Days = salesLast30Days.length;
  const salesCountPrevious30Days = sales30To60DaysAgo.length;
  const salesChange =
    salesCountPrevious30Days > 0
      ? ((salesCountLast30Days - salesCountPrevious30Days) /
          salesCountPrevious30Days) *
        100
      : salesCountLast30Days > 0
        ? 100
        : 0;

  // --- Revenue Analysis (from completed sales only) ---
  const calculateRevenue = (saleList: Sale[]) =>
    saleList
      .filter((sale) => sale && sale.status === "completed")
      .reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

  const revenueLast30Days = calculateRevenue(salesLast30Days);
  const revenuePrevious30Days = calculateRevenue(sales30To60DaysAgo);
  const revenueChange =
    revenuePrevious30Days > 0
      ? ((revenueLast30Days - revenuePrevious30Days) / revenuePrevious30Days) *
        100
      : revenueLast30Days > 0
        ? 100
        : 0;

  const totalRevenue: TotalRevenue = safeSales
    .filter((sale) => sale && sale.status === "completed")
    .reduce((acc, sale) => {
      const totalAmount = sale.totalAmount || 0;
      const currency = sale.currency || "EUR";
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += totalAmount;
      return acc;
    }, {} as TotalRevenue);

  // --- Member Analysis ---
  const newMembersLast30Days = safeMembers.filter(
    (m) => m && new Date(m.registrationDate) >= thirtyDaysAgo
  ).length;
  const newMembers30To60DaysAgo = safeMembers.filter(
    (m) =>
      m &&
      new Date(m.registrationDate) >= sixtyDaysAgo &&
      new Date(m.registrationDate) < thirtyDaysAgo
  ).length;
  const newMembersChange =
    newMembers30To60DaysAgo > 0
      ? ((newMembersLast30Days - newMembers30To60DaysAgo) /
          newMembers30To60DaysAgo) *
        100
      : newMembersLast30Days > 0
        ? 100
        : 0;

  return {
    totalMembers,
    activeMembersCount,
    totalRevenue,
    unpaidSales,
    revenueLast30Days,
    revenueChange,
    newMembersLast30Days,
    newMembersChange,
    salesLast30Days: salesCountLast30Days,
    salesChange,
  };
};
