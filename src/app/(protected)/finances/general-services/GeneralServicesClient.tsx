"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, History, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BentoCard } from "@/components/ui/bento-card";
import { GeneralServiceList } from "@/components/finances/GeneralServiceList";
import { GeneralServiceHistory } from "@/components/finances/GeneralServiceHistory";
import { GeneralServiceSalesHistory } from "@/components/finances/GeneralServiceSalesHistory";
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
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
            className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
          >
            <Plus className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави услуга
          </Button>
        </PageHeader>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-12 flex-wrap gap-4 px-2">
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit border border-zinc-100 dark:border-zinc-800 mb-0">
            <TabsTrigger
              value="services"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              <Wrench className="mr-3 h-4 w-4" strokeWidth={1.5} /> Услуги
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              <History className="mr-3 h-4 w-4" strokeWidth={1.5} /> Движения
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-primary transition-all py-3"
            >
              <ShoppingBag className="mr-3 h-4 w-4" strokeWidth={1.5} />{" "}
              Продажби
            </TabsTrigger>
          </TabsList>

          {!showPageHeader && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-10 px-6 font-medium text-[10px] uppercase tracking-widest transition-all"
            >
              <Plus className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} /> Добави услуга
            </Button>
          )}
        </div>

        <TabsContent
          value="services"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <GeneralServiceList />
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <BentoCard className="p-0 overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-none min-h-[500px]">
            <GeneralServiceHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent
          value="sales"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <BentoCard className="p-0 overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-none min-h-[500px]">
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
