"use client";

import { Activity, ListTree, Package, Wrench } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import GeneralServicesClient from "@/app/(protected)/finances/general-services/GeneralServicesClient";
import RecoveryClientPage from "@/app/(protected)/finances/recovery/client-page";
import ServicesClientPage from "@/app/(protected)/finances/services/client-page";
import { Service } from "@/app/(protected)/finances/services/service.types";
import InventoryClient from "@/app/(protected)/inventory/InventoryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/use-app-store";
import { ClubService } from "@/types";

interface CatalogsClientProps {
  services: Service[];
  recoveryServices: ClubService[];
}

export default function CatalogsClient({
  services,
  recoveryServices,
}: CatalogsClientProps) {
  const searchParams = useSearchParams();
  const { activeBranch } = useAppStore();
  const isRecoveryOnly = activeBranch === "recoveryzone";

  const defaultTab = isRecoveryOnly
    ? "recovery"
    : searchParams.get("tab") || "services";
  const [catalogsSubTab, setCatalogsSubTab] = useState<string>(defaultTab);

  useEffect(() => {
    if (isRecoveryOnly) {
      setCatalogsSubTab("recovery");
    }
  }, [isRecoveryOnly]);

  return (
    <div className="space-y-10">
      <div className="pt-2">
        <Tabs
          defaultValue={defaultTab}
          value={catalogsSubTab}
          onValueChange={setCatalogsSubTab}
          className="space-y-6"
        >
          <TabsList className="no-scrollbar mb-2 flex h-11 w-full justify-start overflow-x-auto rounded-2xl border border-zinc-200/40 bg-zinc-100 p-1 sm:inline-flex sm:w-fit dark:border-zinc-800/40 dark:bg-zinc-900/50">
            {!isRecoveryOnly && (
              <>
                <TabsTrigger
                  value="services"
                  className="rounded-xl px-5 text-xs font-semibold tracking-wide whitespace-nowrap shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
                >
                  <ListTree className="mr-2 size-3.5" />
                  Тренировки
                </TabsTrigger>
                <TabsTrigger
                  value="general"
                  className="rounded-xl px-5 text-xs font-semibold tracking-wide whitespace-nowrap shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
                >
                  <Wrench className="mr-2 size-3.5" />
                  Клубни Услуги
                </TabsTrigger>
              </>
            )}
            <TabsTrigger
              value="recovery"
              className="rounded-xl px-5 text-xs font-semibold tracking-wide whitespace-nowrap shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
            >
              <Activity className="mr-2 size-3.5" />
              Възстановяване
            </TabsTrigger>
            {!isRecoveryOnly && (
              <TabsTrigger
                value="inventory"
                className="rounded-xl px-5 text-xs font-semibold tracking-wide whitespace-nowrap shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
              >
                <Package className="mr-2 size-3.5" />
                Магазин / Стоки
              </TabsTrigger>
            )}
          </TabsList>

          {!isRecoveryOnly && (
            <>
              <TabsContent value="services" className="mt-0 outline-none">
                <div className="rounded-5xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
                  <ServicesClientPage showPageHeader={false} data={services} />
                </div>
              </TabsContent>

              <TabsContent value="general" className="mt-0 outline-none">
                <div className="rounded-5xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
                  <GeneralServicesClient showPageHeader={false} />
                </div>
              </TabsContent>
            </>
          )}

          <TabsContent value="recovery" className="mt-0 outline-none">
            <div className="rounded-5xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
              <RecoveryClientPage
                showPageHeader={false}
                data={recoveryServices}
              />
            </div>
          </TabsContent>

          {!isRecoveryOnly && (
            <TabsContent value="inventory" className="mt-0 outline-none">
              <div className="rounded-5xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
                <InventoryClient showPageHeader={false} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
