"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  History,
  Activity,
  Boxes,
  ListTree,
  Wrench,
  DollarSign,
  Briefcase,
  Layers,
} from "lucide-react";
import SubscriptionsClient from "@/app/(protected)/subscriptions/SubscriptionsClient";
import SalesClient from "@/app/(protected)/sales/SalesClient";
import ServicesClientPage from "@/app/(protected)/finances/services/client-page";
import GeneralServicesClientPage from "@/app/(protected)/finances/general-services/client-page";
import RecoveryClientPage from "@/app/(protected)/finances/recovery/client-page";
import InventoryClient from "@/app/(protected)/inventory/InventoryClient";
import FinancesDashboardCharts from "./FinancesDashboardCharts";

interface FinancesClientProps {
  initialSales: any[];
  initialMembers: any[];
  services: any[];
  recoveryServices: any[];
  financesData: any;
}

export default function FinancesClient({
  initialSales,
  initialMembers,
  services,
  recoveryServices,
  financesData,
}: FinancesClientProps) {
  const [activeTab, setActiveTab] = useState<"operations" | "catalogs">(
    "operations"
  );
  const [operationsSubTab, setOperationsSubTab] =
    useState<string>("subscriptions");
  const [catalogsSubTab, setCatalogsSubTab] = useState<string>("services");

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Financial Analytics Dashboard at the top */}
      <FinancesDashboardCharts data={financesData} />

      {/* Main Unified Navigation tabs */}
      <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-light text-zinc-950 dark:text-zinc-50 uppercase tracking-widest flex items-center gap-3">
              {activeTab === "operations" ? (
                <>
                  <Briefcase
                    className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
                    strokeWidth={1.5}
                  />
                  <span>Каса & Операции</span>
                </>
              ) : (
                <>
                  <Layers
                    className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
                    strokeWidth={1.5}
                  />
                  <span>Клубни Каталози</span>
                </>
              )}
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-light mt-1.5">
              {activeTab === "operations"
                ? "Управление на активните клубни членства, плащания и хроника на транзакциите."
                : "Управление на ценоразписи, тренировъчни програми, възстановяване и наличности на склад."}
            </p>
          </div>

          {/* Premium Main Switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm w-full md:w-auto">
            <button
              onClick={() => setActiveTab("operations")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeTab === "operations"
                  ? "bg-zinc-950 dark:bg-zinc-800 text-white shadow-md shadow-zinc-900/10 dark:shadow-none"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Каса & Операции
            </button>
            <button
              onClick={() => setActiveTab("catalogs")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeTab === "catalogs"
                  ? "bg-zinc-950 dark:bg-zinc-800 text-white shadow-md shadow-zinc-900/10 dark:shadow-none"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <Layers className="h-4 w-4" />
              Клубни Каталози
            </button>
          </div>
        </div>

        {/* Tab Content Section */}
        {activeTab === "operations" ? (
          <Tabs
            defaultValue="subscriptions"
            value={operationsSubTab}
            onValueChange={setOperationsSubTab}
            className="space-y-6"
          >
            <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl h-11 w-full sm:w-fit border border-zinc-200/40 dark:border-zinc-800/40 mb-2">
              <TabsTrigger
                value="subscriptions"
                className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all"
              >
                <CreditCard className="h-3.5 w-3.5 mr-2" />
                Членства & Такси
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all"
              >
                <History className="h-3.5 w-3.5 mr-2" />
                Хроника на продажбите
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
          </Tabs>
        ) : (
          <Tabs
            defaultValue="services"
            value={catalogsSubTab}
            onValueChange={setCatalogsSubTab}
            className="space-y-6"
          >
            <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl h-11 w-full sm:w-fit border border-zinc-200/40 dark:border-zinc-800/40 mb-2 overflow-x-auto no-scrollbar justify-start flex sm:inline-flex">
              <TabsTrigger
                value="services"
                className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all whitespace-nowrap"
              >
                <ListTree className="h-3.5 w-3.5 mr-2" />
                Тренировки
              </TabsTrigger>
              <TabsTrigger
                value="general"
                className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all whitespace-nowrap"
              >
                <Wrench className="h-3.5 w-3.5 mr-2" />
                Клубни Услуги
              </TabsTrigger>
              <TabsTrigger
                value="recovery"
                className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all whitespace-nowrap"
              >
                <Activity className="h-3.5 w-3.5 mr-2" />
                Възстановяване
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="rounded-xl px-5 text-xs font-semibold tracking-wide data-[state=active]:bg-white data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:text-white shadow-none transition-all whitespace-nowrap"
              >
                <Boxes className="h-3.5 w-3.5 mr-2" />
                Магазин & Наличности
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="outline-none mt-0">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
                <ServicesClientPage showPageHeader={false} data={services} />
              </div>
            </TabsContent>

            <TabsContent value="general" className="outline-none mt-0">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
                <GeneralServicesClientPage showPageHeader={false} />
              </div>
            </TabsContent>

            <TabsContent value="recovery" className="outline-none mt-0">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
                <RecoveryClientPage
                  showPageHeader={false}
                  data={recoveryServices}
                />
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="outline-none mt-0">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
                <InventoryClient showPageHeader={false} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
