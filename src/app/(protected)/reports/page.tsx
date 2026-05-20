import ReportsClient from "./ReportsClient";
import { getSales } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { getLowStockProducts } from "@/services/inventory-service";
import {
  generateAttendanceReport,
  generateLiabilityReport,
} from "@/services/report-service";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sales, members, unpaidMembers, attendanceReport, productsToRestock] =
    await Promise.all([
      getSales(),
      getAllMembers(),
      generateLiabilityReport(currentYear, currentMonth),
      generateAttendanceReport(startOfMonth, now),
      getLowStockProducts(),
    ]);

  return (
    <ReportsClient
      initialSales={sales}
      initialMembers={members}
      initialLiabilities={unpaidMembers}
      initialLiabilitiesPeriod={{ year: currentYear, month: currentMonth }}
      initialAttendanceData={attendanceReport}
      initialAttendancePeriod={{
        startDate: startOfMonth.toISOString(),
        endDate: now.toISOString(),
      }}
      initialRestockProducts={productsToRestock}
    />
  );
}
