"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListTree, Wrench, Activity, Layers } from "lucide-react";
import ServicesClientPage from "@/app/(protected)/finances/services/client-page";
import GeneralServicesClientPage from "@/app/(protected)/finances/general-services/client-page";
import RecoveryClientPage from "@/app/(protected)/finances/recovery/client-page";

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
      <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-light text-zinc-950 dark:text-zinc-50 uppercase tracking-widest flex items-center gap-3">
              <Layers
                className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
                strokeWidth={1.5}
              />
              <span>Клубни Каталози</span>
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-light mt-1.5">
              Управление на ценоразписи, тренировъчни програми и възстановяване.
            </p>
          </div>
        </div>

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
        </Tabs>
      </div>
    </div>
  );
}
