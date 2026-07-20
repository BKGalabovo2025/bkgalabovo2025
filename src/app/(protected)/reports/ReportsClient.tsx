"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinancialReport from "@/components/reports/financial-report";
import LiabilitiesReport from "@/components/reports/liabilities-report";
import RestockReport from "@/components/reports/restock-report";
import AttendanceReport from "@/components/reports/attendance-report";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { BarChart3, Users, Wallet, RefreshCw } from "lucide-react";
import { Member, Product } from "@/types";
import type { AttendanceReportItem } from "@/services/report-service";
import type { FinancialReportData } from "@/lib/actions/reports";

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
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title="Справки и Анализи"
        description="Генериране на подробни отчети за финансовото състояние, посещаемостта и инвентара."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Справки" },
        ]}
      />

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="mb-8 flex w-full flex-wrap gap-1 rounded-2xl bg-slate-100 p-1.5 sm:w-fit">
          <TabsTrigger
            value="financial"
            className="flex-1 rounded-xl px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm sm:flex-none"
          >
            <BarChart3 className="mr-2 size-4" /> Финанси
          </TabsTrigger>
          <TabsTrigger
            value="liabilities"
            className="flex-1 rounded-xl px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm sm:flex-none"
          >
            <Wallet className="mr-2 size-4" /> Задължения
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="flex-1 rounded-xl px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm sm:flex-none"
          >
            <Users className="mr-2 size-4" /> Присъствие
          </TabsTrigger>
          <TabsTrigger
            value="restock"
            className="flex-1 rounded-xl px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm sm:flex-none"
          >
            <RefreshCw className="mr-2 size-4" /> Зареждане
          </TabsTrigger>
        </TabsList>

        <BentoCard className="overflow-hidden border-none bg-white p-0 shadow-md">
          <TabsContent
            value="financial"
            className="mt-0 p-6 ring-0 outline-none focus-visible:outline-none"
          >
            <FinancialReport initialData={initialFinancialData} />
          </TabsContent>
          <TabsContent
            value="liabilities"
            className="mt-0 p-6 ring-0 outline-none focus-visible:outline-none"
          >
            <LiabilitiesReport
              initialUnpaidMembers={initialLiabilities}
              initialYear={initialLiabilitiesPeriod.year}
              initialMonth={initialLiabilitiesPeriod.month}
            />
          </TabsContent>
          <TabsContent
            value="attendance"
            className="mt-0 p-6 ring-0 outline-none focus-visible:outline-none"
          >
            <AttendanceReport
              initialReportData={initialAttendanceData}
              initialStartDate={initialAttendancePeriod.startDate}
              initialEndDate={initialAttendancePeriod.endDate}
            />
          </TabsContent>
          <TabsContent
            value="restock"
            className="mt-0 p-6 ring-0 outline-none focus-visible:outline-none"
          >
            <RestockReport initialProducts={initialRestockProducts} />
          </TabsContent>
        </BentoCard>
      </Tabs>
    </div>
  );
}
