import "server-only";
import { Sale } from "@/types";

type CategoryRevenue = {
  name: string;
  value: number;
  color: string;
};

type DailyRevenueTrend = {
  date: string;
  amount: number;
};

const DEFAULT_CATEGORY_COLORS = {
  subscription: "#2563eb",
  recovery: "#06b6d4",
  shop: "#8b5cf6",
  other: "#f59e0b",
  recoveryZoneSubscription: "#10b981",
  recoveryZoneRecovery: "#34d399",
};

const isRecoveryItem = (itemName: string | undefined): boolean => {
  if (!itemName) return false;
  return /recovery|възстанов|сауна|масаж|ледена|физио/i.test(itemName);
};

const isShopItem = (itemName: string | undefined): boolean => {
  if (!itemName) return false;
  return /перо|пера|ракета|грип|наплитане|сок|вода|енергийна|екстра|малка/i.test(
    itemName
  );
};

const formatTrendDate = (date: Date): string => {
  return date.toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
  });
};

function buildDailyRevenueTrend(sales: Sale[], days = 30): DailyRevenueTrend[] {
  const now = new Date();
  const dailyTrendMap = new Map<string, number>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    dailyTrendMap.set(formatTrendDate(day), 0);
  }

  sales.forEach((sale) => {
    const saleDate = new Date(sale.saleDate);
    saleDate.setHours(0, 0, 0, 0);
    const dateStr = formatTrendDate(saleDate);
    if (dailyTrendMap.has(dateStr)) {
      dailyTrendMap.set(
        dateStr,
        (dailyTrendMap.get(dateStr) || 0) + (sale.totalAmount || 0)
      );
    }
  });

  return Array.from(dailyTrendMap.entries()).map(([date, amount]) => ({
    date,
    amount: Math.round(amount * 100) / 100,
  }));
}

function calculateRevenueCategories(
  sales: Sale[],
  activeBranch: string
): CategoryRevenue[] {

  let recoveryRevenue = 0;
  let shopRevenue = 0;
  let otherRevenue = 0;

  sales.forEach((sale) => {
    const amount = sale.totalAmount || 0;


    const hasRecoveryItem = sale.items?.some((item) =>
      isRecoveryItem(item.name)
    );
    if (hasRecoveryItem) {
      recoveryRevenue += amount;
      return;
    }

    const hasShopItem = sale.items?.some((item) => isShopItem(item.name));
    if (hasShopItem) {
      shopRevenue += amount;
      return;
    }

    otherRevenue += amount;
  });

  const isRecoveryZone = activeBranch === "recoveryzone";
  const categories: CategoryRevenue[] = [

    {
      name: "Възстановяване",
      value: Math.round(recoveryRevenue * 100) / 100,
      color: isRecoveryZone
        ? DEFAULT_CATEGORY_COLORS.recoveryZoneRecovery
        : DEFAULT_CATEGORY_COLORS.recovery,
    },
    {
      name: "Магазин & Бар",
      value: Math.round(shopRevenue * 100) / 100,
      color: DEFAULT_CATEGORY_COLORS.shop,
    },
    {
      name: "Други услуги",
      value: Math.round(otherRevenue * 100) / 100,
      color: DEFAULT_CATEGORY_COLORS.other,
    },
  ].filter((category) => category.value > 0);

  if (categories.length === 0) {
    return [
      {
        name: "Няма продажби",
        value: 0.01,
        color: "#e4e4e7",
      },
    ];
  }

  return categories;
}

export function calculateFinancesOverview(sales: Sale[], activeBranch: string) {
  const filteredSales = sales.filter(
    (sale) => sale.isPaid && sale.status === "completed"
  );

  const forOverview = filteredSales;
  const totalRevenue =
    Math.round(
      forOverview.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) * 100
    ) / 100;
  const transactionCount = forOverview.length;
  const averageTransactionValue =
    transactionCount > 0
      ? Math.round((totalRevenue / transactionCount) * 100) / 100
      : 0;

  return {
    dailyTrend: buildDailyRevenueTrend(forOverview),
    categories: calculateRevenueCategories(forOverview, activeBranch),
    totalRevenue,
    transactionCount,
    averageTransactionValue,
  };
}
