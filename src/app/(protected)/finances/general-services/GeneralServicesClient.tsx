"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, History, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BentoCard } from "@/components/ui/bento-card";
import { GeneralServiceList } from "@/components/finances/GeneralServiceList";
import { GeneralServiceHistory } from "@/components/finances/GeneralServiceHistory";
import { GeneralServiceSalesHistory } from "@/components/finances/UnifiedServiceSalesHistory";
import { AddGeneralServiceDialog } from "@/components/finances/AddGeneralServiceDialog";
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
            className="h-12 rounded-xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
          >
            <Plus className="mr-3 size-4" strokeWidth={1.5} /> Добави услуга
          </Button>
        </PageHeader>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 px-2">
          <TabsList className="mb-0 w-fit rounded-2xl border border-zinc-100 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <TabsTrigger
              value="services"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <Wrench className="mr-3 size-4" strokeWidth={1.5} /> Услуги
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <History className="mr-3 size-4" strokeWidth={1.5} /> Движения
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-zinc-800"
            >
              <ShoppingBag className="mr-3 size-4" strokeWidth={1.5} /> Продажби
            </TabsTrigger>
          </TabsList>

          {!showPageHeader && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="h-10 rounded-xl bg-zinc-950 px-6 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
            >
              <Plus className="mr-2 size-3.5" strokeWidth={1.5} /> Добави услуга
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
          <BentoCard className="min-h-125 overflow-hidden rounded-5xl border border-zinc-100 bg-white p-0 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
            <GeneralServiceHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent
          value="sales"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <BentoCard className="min-h-125 overflow-hidden rounded-5xl border border-zinc-100 bg-white p-0 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
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
