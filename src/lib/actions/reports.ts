"use server";
import "server-only";

import { cookies } from "next/headers";

import { getCachedSalesForBranch } from "@/lib/db/sales";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member, Sale } from "@/types";

export interface FinancialReportData {
  total: number;
  chartData: { name: string; value: number; color: string }[];
  sales: (Sale & { memberName: string })[];
}

export async function generateFinancialReportAction(
  startDateStr: string | null,
  endDateStr: string | null,
  paymentType: string = "all"
): Promise<FinancialReportData> {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  const [allSales, allMembers] = await Promise.all([
    getCachedSalesForBranch(activeBranch),
    getAllMembersServer(),
  ]);

  const memberMap = new Map<string, Member>(allMembers.map((m) => [m.id!, m]));

  const startDate = startDateStr ? new Date(startDateStr) : null;
  if (startDate) startDate.setHours(0, 0, 0, 0);

  const endDate = endDateStr ? new Date(endDateStr) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  // Filter on the server
  const filteredSales = allSales.filter((s) => {
    const saleDate = new Date(s.saleDate);

    const isInDateRange =
      (!startDate || saleDate >= startDate) &&
      (!endDate || saleDate <= endDate);

    const isTypeMatch =
      paymentType === "all" ||
      s.type === paymentType ||
      (!s.type && paymentType === "inventory");

    return isInDateRange && isTypeMatch && s.type !== "camp_fee";
  });

  const paidSales = filteredSales.filter((s) => s.isPaid !== false);
  const totalRevenue = paidSales.reduce((acc, s) => acc + s.totalAmount, 0);

  let shopRev = 0;
  let trainingRev = 0;
  let generalRev = 0;
  let recoveryRev = 0;

  for (const s of paidSales) {
    const saleType = s.type as string | undefined;
    if (saleType === "training_service") {
      trainingRev += s.totalAmount;
    } else if (saleType === "general_service") {
      generalRev += s.totalAmount;
    } else if (saleType === "recovery_service") {
      recoveryRev += s.totalAmount;
    } else {
      shopRev += s.totalAmount;
    }
  }

  const chartData = [
    { name: "Екипировка и Магазин", value: shopRev, color: "#2563eb" },
    { name: "Тренировки и Карти", value: trainingRev, color: "#10b981" },
    { name: "Услуги", value: generalRev, color: "#f59e0b" },
    { name: "Recovery Zone", value: recoveryRev, color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  // Sort latest first and map member names to reduce client-side mapping
  const enrichedSales = filteredSales
    .sort(
      (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    )
    .map((s) => {
      const member = s.memberId ? memberMap.get(s.memberId) : null;
      return {
        ...s,
        memberName: member
          ? `${member.firstName} ${member.lastName}`
          : s.clientName || "Гост",
      };
    });

  return {
    total: totalRevenue,
    chartData,
    sales: enrichedSales,
  };
}
