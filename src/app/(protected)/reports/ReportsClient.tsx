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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Справки и Анализи"
        description="Генериране на подробни отчети за финансовото състояние, посещаемостта и инвентара."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Справки" },
        ]}
      />

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit mb-8 flex flex-wrap gap-1">
          <TabsTrigger
            value="financial"
            className="flex-1 sm:flex-none rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
          >
            <BarChart3 className="mr-2 h-4 w-4" /> Финанси
          </TabsTrigger>
          <TabsTrigger
            value="liabilities"
            className="flex-1 sm:flex-none rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
          >
            <Wallet className="mr-2 h-4 w-4" /> Задължения
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="flex-1 sm:flex-none rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
          >
            <Users className="mr-2 h-4 w-4" /> Присъствие
          </TabsTrigger>
          <TabsTrigger
            value="restock"
            className="flex-1 sm:flex-none rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2.5"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Зареждане
          </TabsTrigger>
        </TabsList>

        <BentoCard className="p-0 overflow-hidden border-none shadow-md bg-white">
          <TabsContent
            value="financial"
            className="mt-0 focus-visible:outline-none outline-none ring-0 p-6"
          >
            <FinancialReport initialData={initialFinancialData} />
          </TabsContent>
          <TabsContent
            value="liabilities"
            className="mt-0 focus-visible:outline-none outline-none ring-0 p-6"
          >
            <LiabilitiesReport
              initialUnpaidMembers={initialLiabilities}
              initialYear={initialLiabilitiesPeriod.year}
              initialMonth={initialLiabilitiesPeriod.month}
            />
          </TabsContent>
          <TabsContent
            value="attendance"
            className="mt-0 focus-visible:outline-none outline-none ring-0 p-6"
          >
            <AttendanceReport
              initialReportData={initialAttendanceData}
              initialStartDate={initialAttendancePeriod.startDate}
              initialEndDate={initialAttendancePeriod.endDate}
            />
          </TabsContent>
          <TabsContent
            value="restock"
            className="mt-0 focus-visible:outline-none outline-none ring-0 p-6"
          >
            <RestockReport initialProducts={initialRestockProducts} />
          </TabsContent>
        </BentoCard>
      </Tabs>
    </div>
  );
}
