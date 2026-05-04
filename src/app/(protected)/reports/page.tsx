"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FinancialReport from "@/components/reports/financial-report";
import LiabilitiesReport from "@/components/reports/liabilities-report";
import RestockReport from "@/components/reports/restock-report";
import AttendanceReport from "@/components/reports/attendance-report"; // Импортираме новия компонент

const ReportsPage = () => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-2">
        <h1 className="text-5xl font-black font-heading tracking-tight text-zinc-900 dark:text-white">Справки и Анализи</h1>
        <p className="text-zinc-500 text-lg font-medium">Преглед на финансови резултати, посещаемост и наличности в реално време.</p>
      </header>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-1.5 h-14 border border-zinc-200 dark:border-zinc-700 shadow-inner flex overflow-x-auto no-scrollbar max-w-fit mb-10">
          <TabsTrigger value="financial" className="rounded-2xl px-10 h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-lg font-black font-heading transition-all whitespace-nowrap">Финанси</TabsTrigger>
          <TabsTrigger value="liabilities" className="rounded-2xl px-10 h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-lg font-black font-heading transition-all whitespace-nowrap">Задължения</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-2xl px-10 h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-lg font-black font-heading transition-all whitespace-nowrap">Присъствия</TabsTrigger>
          <TabsTrigger value="restock" className="rounded-2xl px-10 h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-lg font-black font-heading transition-all whitespace-nowrap">Зареждане</TabsTrigger>
        </TabsList>
        
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <TabsContent value="financial" className="mt-0 ring-offset-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
              <FinancialReport />
            </div>
          </TabsContent>
          <TabsContent value="liabilities" className="mt-0 ring-offset-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
              <LiabilitiesReport />
            </div>
          </TabsContent>
          <TabsContent value="attendance" className="mt-0 ring-offset-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
              <AttendanceReport />
            </div>
          </TabsContent>
          <TabsContent value="restock" className="mt-0 ring-offset-0 focus-visible:ring-0">
            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
              <RestockReport />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
