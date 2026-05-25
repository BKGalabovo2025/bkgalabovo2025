"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListTree, Wrench, Activity, Package } from "lucide-react";
import ServicesClientPage from "@/app/(protected)/finances/services/client-page";
import GeneralServicesClient from "@/app/(protected)/finances/general-services/GeneralServicesClient";
import RecoveryClientPage from "@/app/(protected)/finances/recovery/client-page";
import InventoryClient from "@/app/(protected)/inventory/InventoryClient";

interface CatalogsClientProps {
  services: any[];
  recoveryServices: any[];
}

export default function CatalogsClient({
  services,
  recoveryServices,
}: CatalogsClientProps) {
  const [catalogsSubTab, setCatalogsSubTab] = useState<string>("services");

  return (
    <div className="space-y-10">
      <div className="pt-2">

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
              <Package className="h-3.5 w-3.5 mr-2" />
              Магазин / Стоки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="outline-none mt-0">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
              <ServicesClientPage showPageHeader={false} data={services} />
            </div>
          </TabsContent>

          <TabsContent value="general" className="outline-none mt-0">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-5xl p-6 sm:p-8 shadow-sm">
              <GeneralServicesClient showPageHeader={false} />
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
      </div>
    </div>
  );
}
