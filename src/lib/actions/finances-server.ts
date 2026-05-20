"use server";

import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { Sale } from "@/types";

// Помощна функция за преобразуване на Firestore документи
function snapToData<T>(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const convertTimestamps = (val: any): any => {
    if (!val) return val;
    if (typeof val.toDate === "function") {
      return val.toDate().toISOString();
    }
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: any = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps(val[key]);
      }
      return copy;
    }
    return val;
  };

  return {
    id: doc.id,
    ...convertTimestamps(data),
  } as T;
}

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

    const adminDb = getAdminDb();
    let salesQuery: admin.firestore.Query = adminDb.collection("sales");

    // Филтриране по клон (мултитенант)
    if (activeBranch && activeBranch !== "bkgalabovo") {
      salesQuery = salesQuery.where("siteId", "==", activeBranch);
    }

    const snapshot = await salesQuery.get();
    const allSales = snapshot.docs
      .map((doc) => snapToData<Sale>(doc))
      .filter(
        (s): s is Sale => s !== null && s.isPaid && s.status !== "cancelled"
      );

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Филтрираме само за последните 30 дни в паметта
    const recentSales = allSales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= thirtyDaysAgo;
    });

    // 1. Изчисляване на общ оборот и транзакции
    const totalRevenue = recentSales.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0
    );
    const transactionCount = recentSales.length;
    const averageTransactionValue =
      transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // 2. Генериране на дневен тренд (30 дни назад до днес)
    const dailyTrendMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
      });
      dailyTrendMap.set(dateStr, 0);
    }

    recentSales.forEach((sale) => {
      const saleDate = new Date(sale.saleDate);
      const dateStr = saleDate.toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
      });
      if (dailyTrendMap.has(dateStr)) {
        dailyTrendMap.set(
          dateStr,
          (dailyTrendMap.get(dateStr) || 0) + (sale.totalAmount || 0)
        );
      }
    });

    const dailyTrend: DailyRevenueTrend[] = [];
    dailyTrendMap.forEach((amount, date) => {
      dailyTrend.push({ date, amount: Math.round(amount * 100) / 100 });
    });

    // 3. Разделение по категории
    let subscriptionRevenue = 0;
    let recoveryRevenue = 0;
    let shopRevenue = 0;
    let otherRevenue = 0;

    recentSales.forEach((sale) => {
      const amount = sale.totalAmount || 0;
      if (sale.subscriptionId) {
        subscriptionRevenue += amount;
      } else {
        const hasRecoveryItem = sale.items?.some((item) =>
          /recovery|възстанов|сауна|масаж|ледена|физио/i.test(item.name || "")
        );
        if (hasRecoveryItem) {
          recoveryRevenue += amount;
        } else {
          const hasShopItem = sale.items?.some((item) =>
            /перо|пера|ракета|грип|наплитане|сок|вода|енергийна|екстра|малка/i.test(
              item.name || ""
            )
          );
          if (hasShopItem) {
            shopRevenue += amount;
          } else {
            otherRevenue += amount;
          }
        }
      }
    });

    // Цветове спрямо темата на клона
    const isRecoveryZone = activeBranch === "recoveryzone";
    const subColor = isRecoveryZone ? "#10b981" : "#2563eb"; // Emerald vs Blue
    const recColor = isRecoveryZone ? "#34d399" : "#06b6d4"; // Light emerald vs Cyan
    const shopColor = "#8b5cf6"; // Violet
    const otherColor = "#f59e0b"; // Amber

    const categories: CategoryRevenue[] = [
      {
        name: "Абонаменти",
        value: Math.round(subscriptionRevenue * 100) / 100,
        color: subColor,
      },
      {
        name: "Възстановяване",
        value: Math.round(recoveryRevenue * 100) / 100,
        color: recColor,
      },
      {
        name: "Магазин & Бар",
        value: Math.round(shopRevenue * 100) / 100,
        color: shopColor,
      },
      {
        name: "Други услуги",
        value: Math.round(otherRevenue * 100) / 100,
        color: otherColor,
      },
    ].filter((c) => c.value > 0);

    // Ако няма данни, добавяме празни стойности за добър визуален изглед
    if (categories.length === 0) {
      categories.push({ name: "Няма продажби", value: 0.01, color: "#e4e4e7" });
    }

    return {
      success: true,
      data: {
        dailyTrend,
        categories,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        transactionCount,
        averageTransactionValue:
          Math.round(averageTransactionValue * 100) / 100,
      },
    };
  } catch (error: any) {
    console.error("Error getFinancesOverviewDataAction:", error);
    return {
      success: false,
      error: error.message || "Грешка при извличане на финансовата статистика.",
    };
  }
}
