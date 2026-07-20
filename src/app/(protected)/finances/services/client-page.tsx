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
    <div className="space-y-8 pb-24 duration-500 animate-in fade-in">
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
            className="h-12 rounded-2xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-xl shadow-zinc-200 transition-all hover:bg-zinc-800"
          >
            <PlusCircle className="mr-3 size-4" strokeWidth={1.5} /> Добави
            услуга
          </Button>
        </PageHeader>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4 px-2">
          <TabsList className="mb-0 w-fit rounded-2xl border border-zinc-100 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <TabsTrigger
              value="services"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-500 dark:data-[state=active]:bg-zinc-800"
            >
              <LayoutGrid className="mr-3 size-4" strokeWidth={1.5} /> Услуги
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-500 dark:data-[state=active]:bg-zinc-800"
            >
              <History className="mr-3 size-4" strokeWidth={1.5} /> Движения
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-500 dark:data-[state=active]:bg-zinc-800"
            >
              <ShoppingBag className="mr-3 size-4" strokeWidth={1.5} />{" "}
              Продажби
            </TabsTrigger>
          </TabsList>

          {activeTab === "services" && !showPageHeader && (
            <div className="flex items-center gap-4">
              <Tabs
                value={view}
                onValueChange={(v) => setView(v as "grid" | "table")}
                className="hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1 md:flex"
              >
                <TabsList className="h-9 border-none bg-transparent">
                  <TabsTrigger
                    value="grid"
                    className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <LayoutGrid className="size-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <List className="size-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                onClick={() => setIsAddOpen(true)}
                className="h-10 rounded-xl bg-zinc-950 px-6 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
              >
                <PlusCircle className="mr-2 size-3.5" strokeWidth={1.5} />{" "}
                Добави услуга
              </Button>
            </div>
          )}

          {activeTab === "services" && showPageHeader && (
            <div className="flex items-center gap-4">
              <Tabs
                value={view}
                onValueChange={(v) => setView(v as "grid" | "table")}
                className="hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1 md:flex"
              >
                <TabsList className="h-9 border-none bg-transparent">
                  <TabsTrigger
                    value="grid"
                    className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <LayoutGrid className="size-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <List className="size-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        <TabsContent
          value="services"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          {view === "grid" ? (
            <ServiceMenu
              services={data}
              onEdit={(service) => setEditingService(service)}
              onSale={(service) => setSaleService(service)}
              onDeleteSuccess={handleSuccess}
            />
          ) : (
            <BentoCard className="overflow-hidden rounded-5xl border border-zinc-100 bg-white p-8 shadow-none">
              <DataTable
                columns={columns}
                data={data}
                filterColumnId="name"
                filterPlaceholder="Търсене по име на услуга..."
                isLoading={false}
                emptyStateMessage="Няма намерени услуги."
                renderMobileCard={(service: Service) => (
                  <div className="flex flex-col gap-3 p-4 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {service.name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {service.type}{" "}
                          {service.billingPeriod
                            ? `• ${service.billingPeriod}`
                            : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30">
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
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <BentoCard className="flex h-150 flex-col overflow-hidden rounded-4xl border border-zinc-100 bg-white p-0 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
            <TrainingHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent
          value="sales"
          className="mt-0 ring-0 outline-none focus-visible:outline-none"
        >
          <BentoCard className="flex h-150 flex-col overflow-hidden rounded-4xl border border-zinc-100 bg-white p-0 shadow-none dark:border-zinc-900 dark:bg-zinc-950">
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
