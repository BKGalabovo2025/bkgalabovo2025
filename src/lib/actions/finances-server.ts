"use server";

import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { Sale } from "@/types";
import { calculateFinancesOverview } from "./finances-utils";
import { getCachedSalesForBranch } from "@/lib/db/sales";

export type CategoryRevenue = {
  name: string;
  value: number;
  color: string;
};

export type DailyRevenueTrend = {
  date: string;
  amount: number;
};

export type FinancesOverviewData = {
  success: boolean;
  data?: {
    dailyTrend: DailyRevenueTrend[];
    categories: CategoryRevenue[];
    totalRevenue: number;
    transactionCount: number;
    averageTransactionValue: number;
  };
  error?: string;
};

/**
 * Извлича финансови данни за графиките на страница Финанси (последите 30 дни).
 */
export async function getFinancesOverviewDataAction(
  activeBranch: string
): Promise<FinancesOverviewData> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("Неоторизиран достъп.");
    }

    const sales = await getCachedSalesForBranch(activeBranch);

    const allSales = sales.filter(
      (s): s is Sale => s.isPaid && s.status !== "cancelled"
    );

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentSales = allSales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= thirtyDaysAgo;
    });

    const overview = calculateFinancesOverview(recentSales, activeBranch);

    return {
      success: true,
      data: overview,
    };
  } catch (error: any) {
    console.error("Error getFinancesOverviewDataAction:", error);
    return {
      success: false,
      error: error.message || "Грешка при извличане на финансовата статистика.",
    };
  }
}
