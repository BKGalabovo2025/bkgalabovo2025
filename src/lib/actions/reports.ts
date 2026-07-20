"use server";
import "server-only";

import { getCachedSalesForBranch } from "@/lib/db/sales";
import { getAllMembersServer } from "@/services/member-service.server";
import { cookies } from "next/headers";
import { Sale, Member } from "@/types";

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

  // FIlter on the server
  const filteredSales = allSales.filter((s) => {
    const saleDate = new Date(s.saleDate);

    const isInDateRange =
      (!startDate || saleDate >= startDate) &&
      (!endDate || saleDate <= endDate);

    const isTypeMatch = paymentType === "all" || paymentType === "inventory"; // You can expand this logic if needed

    return isInDateRange && isTypeMatch;
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const chartData = [
    { name: "Приходи от продажби", value: totalRevenue, color: "#2563eb" },
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
        memberName: member ? `${member.firstName} ${member.lastName}` : "—",
      };
    });

  return {
    total: totalRevenue,
    chartData,
    sales: enrichedSales,
  };
}
