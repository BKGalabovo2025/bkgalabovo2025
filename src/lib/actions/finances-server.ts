"use server";

import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensureAdminFromSession } from "@/lib/auth-utils";
import { Sale } from "@/types";
import { calculateFinancesOverview } from "./finances-utils";

// РџРѕРјРѕС‰РЅР° С„СѓРЅРєС†РёСЏ Р·Р° РїСЂРµРѕР±СЂР°Р·СѓРІР°РЅРµ РЅР° Firestore РґРѕРєСѓРјРµРЅС‚Рё
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
 * РР·РІР»РёС‡Р° С„РёРЅР°РЅСЃРѕРІРё РґР°РЅРЅРё Р·Р° РіСЂР°С„РёРєРёС‚Рµ РЅР° СЃС‚СЂР°РЅРёС†Р° Р¤РёРЅР°РЅСЃРё (РїРѕСЃР»РµРґРёС‚Рµ 30 РґРЅРё).
 */
export async function getFinancesOverviewDataAction(
  activeBranch: string
): Promise<FinancesOverviewData> {
  try {
    await ensureAdminFromSession();

    const adminDb = getAdminDb();
    let salesQuery: admin.firestore.Query = adminDb.collection("sales");

    // Р¤РёР»С‚СЂРёСЂР°РЅРµ РїРѕ РєР»РѕРЅ (РјСѓР»С‚РёС‚РµРЅР°РЅС‚)
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
      error: error.message || "Р“СЂРµС€РєР° РїСЂРё РёР·РІР»РёС‡Р°РЅРµ РЅР° С„РёРЅР°РЅСЃРѕРІР°С‚Р° СЃС‚Р°С‚РёСЃС‚РёРєР°.",
    };
  }
}

