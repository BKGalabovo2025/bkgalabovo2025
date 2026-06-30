"use client";

import { useState } from "react";
import { Service } from "./service.types";
import { columns } from "./columns";
import { DataTableRowActions } from "./DataTableRowActions";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  LayoutGrid,
  List,
  History,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { ServiceMenu } from "@/components/finances/ServiceMenu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddTrainingDialog } from "@/components/finances/AddTrainingDialog";
import { EditTrainingDialog } from "@/components/finances/EditTrainingDialog";
import { TrainingSaleWizardDialog } from "@/components/finances/TrainingSaleWizardDialog";
import { TrainingHistory } from "@/components/finances/TrainingHistory";
import { TrainingSalesHistory } from "@/components/finances/TrainingSalesHistory";

interface ServicesClientPageProps {
  data: Service[];
  showPageHeader?: boolean;
}

export default function ServicesClientPage({
  data,
  showPageHeader = true,
}: ServicesClientPageProps) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState("services");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saleService, setSaleService] = useState<Service | null>(null);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {showPageHeader && (
        <PageHeader
          title="Каталог Тренировки"
          description="Каталог на предлаганите абонаменти, еднократни и индивидуални тренировки."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Каталози", href: "/catalogs" },
            { label: "Услуги" },
          ]}
        >
          <Button
            onClick={() => setIsAddOpen(true)}
            className="rounded-2xl shadow-xl shadow-zinc-200 bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
          >
            <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави
            услуга
          </Button>
        </PageHeader>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-12 flex-wrap gap-4 px-2">
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit border border-zinc-100 dark:border-zinc-800 mb-0">
            <TabsTrigger
              value="services"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 transition-all py-3"
            >
              <LayoutGrid className="mr-3 h-4 w-4" strokeWidth={1.5} /> Услуги
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 transition-all py-3"
            >
              <History className="mr-3 h-4 w-4" strokeWidth={1.5} /> Движения
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 transition-all py-3"
            >
              <ShoppingBag className="mr-3 h-4 w-4" strokeWidth={1.5} />{" "}
              Продажби
            </TabsTrigger>
          </TabsList>

          {activeTab === "services" && !showPageHeader && (
            <div className="flex items-center gap-4">
              <Tabs
                value={view}
                onValueChange={(v) => setView(v as "grid" | "table")}
                className="bg-zinc-50 p-1 rounded-xl border border-zinc-100 hidden md:flex"
              >
                <TabsList className="bg-transparent h-9 border-none">
                  <TabsTrigger
                    value="grid"
                    className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                onClick={() => setIsAddOpen(true)}
                className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-10 px-6 font-medium text-[10px] uppercase tracking-widest transition-all"
              >
                <PlusCircle className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />{" "}
                Добави услуга
              </Button>
            </div>
          )}

          {activeTab === "services" && showPageHeader && (
            <div className="flex items-center gap-4">
              <Tabs
                value={view}
                onValueChange={(v) => setView(v as "grid" | "table")}
                className="bg-zinc-50 p-1 rounded-xl border border-zinc-100 hidden md:flex"
              >
                <TabsList className="bg-transparent h-9 border-none">
                  <TabsTrigger
                    value="grid"
                    className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        <TabsContent
          value="services"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          {view === "grid" ? (
            <ServiceMenu
              services={data}
              onEdit={(service) => setEditingService(service)}
              onSale={(service) => setSaleService(service)}
              onDeleteSuccess={handleSuccess}
            />
          ) : (
            <BentoCard className="p-8 overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl">
              <DataTable
                columns={columns}
                data={data}
                filterColumnId="name"
                filterPlaceholder="Търсене по име на услуга..."
                isLoading={false}
                emptyStateMessage="Няма намерени услуги."
                renderMobileCard={(service: Service) => (
                  <div className="p-4 flex flex-col gap-3 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm text-zinc-900 dark:text-white">
                          {service.name}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {service.type}{" "}
                          {service.billingPeriod
                            ? `• ${service.billingPeriod}`
                            : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg text-xs">
                          {service.price} лв.
                        </div>
                        <DataTableRowActions service={service} />
                      </div>
                    </div>
                  </div>
                )}
              />
            </BentoCard>
          )}
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <BentoCard className="p-0 overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-4xl shadow-none h-[600px] flex flex-col">
            <TrainingHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent
          value="sales"
          className="mt-0 focus-visible:outline-none outline-none ring-0"
        >
          <BentoCard className="p-0 overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-4xl shadow-none h-[600px] flex flex-col">
            <TrainingSalesHistory />
          </BentoCard>
        </TabsContent>
      </Tabs>

      <AddTrainingDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditTrainingDialog
        service={editingService}
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onSuccess={handleSuccess}
      />

      {saleService && (
        <TrainingSaleWizardDialog
          service={saleService}
          isOpen={!!saleService}
          onClose={() => setSaleService(null)}
          onSaleSuccess={() => {
            setSaleService(null);
            handleSuccess();
          }}
        />
      )}
    </div>
  );
}
