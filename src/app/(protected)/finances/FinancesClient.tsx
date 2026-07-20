"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Boxes, Briefcase } from "lucide-react";
import SalesClient from "@/app/(protected)/sales/SalesClient";
import InventoryClient from "@/app/(protected)/inventory/InventoryClient";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { Sale, Member } from "@/types";

interface FinancesClientProps {
  initialSales: Sale[];
  initialMembers: Member[];
}

export default function FinancesClient({
  initialSales,
  initialMembers,
}: FinancesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [operationsSubTab, setOperationsSubTab] = useState<string>(
    searchParams.get("tab") || "sales"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== operationsSubTab) {
      setOperationsSubTab(tab);
    }
  }, [searchParams, operationsSubTab]);

  const handleTabChange = (val: string) => {
    setOperationsSubTab(val);
    router.replace(`${pathname}?tab=${val}`, { scroll: false });
  };

  return (
    <div className="space-y-10 pb-24 duration-700 animate-in fade-in">
      {/* Main Unified Navigation tabs */}
      <div>
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-light tracking-widest text-zinc-950 uppercase dark:text-zinc-50">
              <Briefcase
                className="text-zinc-655 size-6 dark:text-zinc-400"
                strokeWidth={1.5}
              />
              <span>Каса & Операции</span>
            </h2>
            <p className="mt-1.5 text-xs font-light text-zinc-400 dark:text-zinc-500">
              Управление на активните плащания, семейни дългове, хроника на
              транзакциите и наличности на склад.
            </p>
          </div>
        </div>

        {/* Tab Content Section */}
        <Tabs
          defaultValue="sales"
          value={operationsSubTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="no-scrollbar mb-2 flex h-11 w-full justify-start overflow-x-auto rounded-2xl border border-zinc-200/40 bg-zinc-100 p-1 sm:inline-flex sm:w-fit dark:border-zinc-800/40 dark:bg-zinc-900/50">
            <TabsTrigger
              value="sales"
              className="rounded-xl px-5 text-xs font-semibold tracking-wide whitespace-nowrap shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
            >
              <History className="mr-2 size-3.5" />
              Хроника на продажбите
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-xl px-5 text-xs font-semibold tracking-wide whitespace-nowrap shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
            >
              <Boxes className="mr-2 size-3.5" />
              Магазин & Наличности
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-0 outline-none">
            <div className="rounded-5xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
              <SalesClient
                showPageHeader={false}
                initialSales={initialSales}
                initialMembers={initialMembers}
              />
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-0 outline-none">
            <div className="rounded-5xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
              <InventoryClient showPageHeader={false} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
