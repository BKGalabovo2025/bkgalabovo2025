"use client";

import { BarChart3, RefreshCw, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import AttendanceReport from "@/components/reports/attendance-report";
import FinancialReport from "@/components/reports/financial-report";
import LiabilitiesReport from "@/components/reports/liabilities-report";
import RestockReport from "@/components/reports/restock-report";
import { BentoCard } from "@/components/ui/bento-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FinancialReportData } from "@/lib/actions/reports";
import type { AttendanceReportItem } from "@/services/report-service";
import { Member, Product } from "@/types";

interface ReportsClientProps {
  initialFinancialData: FinancialReportData;
  initialLiabilities: Member[];
  initialLiabilitiesPeriod: {
    year: number;
    month: number;
  };
  initialAttendanceData: AttendanceReportItem[];
  initialAttendancePeriod: {
    startDate: string;
    endDate: string;
  };
  initialRestockProducts: Product[];
}

export default function ReportsClient({
  initialFinancialData,
  initialLiabilities,
  initialLiabilitiesPeriod,
  initialAttendanceData,
  initialAttendancePeriod,
  initialRestockProducts,
}: ReportsClientProps) {
  return (
    <div className="space-y-4 duration-500 animate-in fade-in">
      <PageHeader
        title="Справки и Анализи"
        description="Генериране на подробни отчети за финансовото състояние, посещаемостта и инвентара."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Справки" },
        ]}
      />

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="mb-3 flex w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
          <TabsTrigger
            value="financial"
            className="flex-1 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs sm:flex-none"
          >
            <BarChart3 className="mr-1.5 size-3.5" /> Финанси
          </TabsTrigger>
          <TabsTrigger
            value="liabilities"
            className="flex-1 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs sm:flex-none"
          >
            <Wallet className="mr-1.5 size-3.5" /> Задължения
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="flex-1 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs sm:flex-none"
          >
            <Users className="mr-1.5 size-3.5" /> Присъствие
          </TabsTrigger>
          <TabsTrigger
            value="restock"
            className="flex-1 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-xs sm:flex-none"
          >
            <RefreshCw className="mr-1.5 size-3.5" /> Зареждане
          </TabsTrigger>
        </TabsList>

        <BentoCard className="overflow-hidden border-none bg-white p-0 shadow-2xs rounded-2xl">
          <TabsContent
            value="financial"
            className="mt-0 p-3 sm:p-4 ring-0 outline-none focus-visible:outline-none"
          >
            <FinancialReport initialData={initialFinancialData} />
          </TabsContent>
          <TabsContent
            value="liabilities"
            className="mt-0 p-3 sm:p-4 ring-0 outline-none focus-visible:outline-none"
          >
            <LiabilitiesReport
              initialUnpaidMembers={initialLiabilities}
              initialYear={initialLiabilitiesPeriod.year}
              initialMonth={initialLiabilitiesPeriod.month}
            />
          </TabsContent>
          <TabsContent
            value="attendance"
            className="mt-0 p-3 sm:p-4 ring-0 outline-none focus-visible:outline-none"
          >
            <AttendanceReport
              initialReportData={initialAttendanceData}
              initialStartDate={initialAttendancePeriod.startDate}
              initialEndDate={initialAttendancePeriod.endDate}
            />
          </TabsContent>
          <TabsContent
            value="restock"
            className="mt-0 p-3 sm:p-4 ring-0 outline-none focus-visible:outline-none"
          >
            <RestockReport initialProducts={initialRestockProducts} />
          </TabsContent>
        </BentoCard>
      </Tabs>
    </div>
  );
}
