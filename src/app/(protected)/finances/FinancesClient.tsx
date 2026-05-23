"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, History, Boxes, Briefcase } from "lucide-react";
import SubscriptionsClient from "@/app/(protected)/subscriptions/SubscriptionsClient";
import SalesClient from "@/app/(protected)/sales/SalesClient";
import InventoryClient from "@/app/(protected)/inventory/InventoryClient";
import FinancesDashboardCharts from "./FinancesDashboardCharts";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface FinancesClientProps {
  initialSales: any[];
  initialMembers: any[];
  financesData: any;
}

export default function FinancesClient({
  initialSales,
  initialMembers,
  financesData,
}: FinancesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [operationsSubTab, setOperationsSubTab] = useState<string>(
    searchParams.get("tab") || "subscriptions"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== operationsSubTab) {
      setOperationsSubTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setOperationsSubTab(val);
    router.replace(`${pathname}?tab=${val}`, { scroll: false });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Financial Analytics Dashboard at the top */}
      <FinancesDashboardCharts data={financesData} />

      {/* Main Unified Navigation tabs */}
      <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-light text-zinc-950 dark:text-zinc-50 uppercase tracking-widest flex items-center gap-3">
              <Briefcase
                className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
                strokeWidth={1.5}
              />
              <span>Каса & Операции</span>
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-light mt-1.5">
              Управление на активните клубни членства, плащания, хроника на
              транзакциите и наличности на склад.
            </p>
          </div>
        </div>

        {/* Tab Content Section */}
        <Tabs
          defaultValue="subscriptions"
          value={operationsSubTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl h-11 w-full sm:w-fit border border-zinc-200/40 dark:border-zinc-800/40 mb-2 overflow-x-auto no-scrollbar justify-start flex sm:inline-flex">
            <TabsTrigger
              value="subscriptions"
              className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all whitespace-nowrap"
            >
              <CreditCard className="h-3.5 w-3.5 mr-2" />
              Членства & Такси
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all whitespace-nowrap"
            >
              <History className="h-3.5 w-3.5 mr-2" />
              Хроника на продажбите
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all whitespace-nowrap"
            >
              <Boxes className="h-3.5 w-3.5 mr-2" />
              Магазин & Наличности
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="outline-none mt-0">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
              <SubscriptionsClient showPageHeader={false} />
            </div>
          </TabsContent>

          <TabsContent value="sales" className="outline-none mt-0">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
              <SalesClient
                showPageHeader={false}
                initialSales={initialSales}
                initialMembers={initialMembers}
              />
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="outline-none mt-0">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
              <InventoryClient showPageHeader={false} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
