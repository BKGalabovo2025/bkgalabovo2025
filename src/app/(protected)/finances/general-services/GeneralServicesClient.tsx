"use client";

import { History, Plus, ShoppingBag, Wrench } from "lucide-react";
import { useState } from "react";

import { AddGeneralServiceDialog } from "@/components/finances/AddGeneralServiceDialog";
import { GeneralServiceHistory } from "@/components/finances/GeneralServiceHistory";
import { GeneralServiceList } from "@/components/finances/GeneralServiceList";
import { GeneralServiceSalesHistory } from "@/components/finances/UnifiedServiceSalesHistory";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGeneralServices } from "@/hooks/useGeneralServices";

interface GeneralServicesClientProps {
  showPageHeader?: boolean;
}

export default function GeneralServicesClient({
  showPageHeader = true,
}: GeneralServicesClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("services");
  const { refetch } = useGeneralServices();

  const handleServiceAdded = () => {
    setIsAddOpen(false);
    refetch();
  };

  return (
    <div className="space-y-8 pb-24 duration-500 animate-in fade-in">
      {showPageHeader && (
        <PageHeader
          title="Клубни услуги"
          description="Каталог за допълнителни клубни услуги - наем на шкаф, наем на ракета и други."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Каталози", href: "/catalogs" },
            { label: "Клубни услуги" },
          ]}
        >
          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-12 w-full sm:w-auto rounded-xl bg-zinc-950 px-6 sm:px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
          >
            <Plus className="mr-3 size-4" strokeWidth={1.5} /> Добави услуга
          </Button>
        </PageHeader>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-1">
          <TabsList className="mb-0 h-9 grid grid-cols-3 w-full sm:w-fit rounded-xl border border-zinc-100 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            <TabsTrigger
              value="services"
              className="rounded-lg px-2 sm:px-4 py-1 text-xs font-semibold tracking-wide uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <Wrench className="mr-1.5 size-3.5" strokeWidth={1.5} /> Услуги
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg px-2 sm:px-4 py-1 text-xs font-semibold tracking-wide uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <History className="mr-1.5 size-3.5" strokeWidth={1.5} /> Движения
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="rounded-lg px-2 sm:px-4 py-1 text-xs font-semibold tracking-wide uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <ShoppingBag className="mr-1.5 size-3.5" strokeWidth={1.5} />{" "}
              Продажби
            </TabsTrigger>
          </TabsList>

          {!showPageHeader && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="h-9 w-full sm:w-auto rounded-xl bg-zinc-950 px-4 text-xs font-semibold tracking-wider text-white uppercase shadow-none transition-all hover:bg-zinc-800"
            >
              <Plus className="mr-1.5 size-3.5" strokeWidth={1.5} /> Добави
              услуга
            </Button>
          )}
        </div>

        <TabsContent
          value="services"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <GeneralServiceList />
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
            <GeneralServiceHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent
          value="sales"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
            <GeneralServiceSalesHistory />
          </BentoCard>
        </TabsContent>
      </Tabs>

      <AddGeneralServiceDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleServiceAdded}
      />
    </div>
  );
}
