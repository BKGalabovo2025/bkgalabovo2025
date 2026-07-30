"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LayoutGrid, List, PlusCircle } from "lucide-react";
import {
  CalendarDays,
  History,
  PackageSearch,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSWRConfig } from "swr";

import { RecoveryClientPackages } from "@/components/finances/RecoveryClientPackages";
import { RecoveryHistory } from "@/components/finances/RecoveryHistory";
import { RecoveryMenu } from "@/components/finances/RecoveryMenu";
import { RecoveryReservationsHistory } from "@/components/finances/RecoveryReservationsHistory";
import { RecoverySalesHistory } from "@/components/finances/UnifiedServiceSalesHistory";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { UnifiedSaleWizardDialog } from "@/components/shared/wizard-v2/UnifiedSaleWizardDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/currency";
import { ClubService } from "@/types";

interface RecoveryClientPageProps {
  data: ClubService[];
  showPageHeader?: boolean;
}

export default function RecoveryClientPage({
  data,
  showPageHeader = true,
}: RecoveryClientPageProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState("services");
  const [selectedSaleService, setSelectedSaleService] =
    useState<ClubService | null>(null);

  const columns: ColumnDef<ClubService>[] = [
    {
      accessorKey: "name",
      header: "Име",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.original.name}</span>
          <span className="text-[10px] tracking-wider text-zinc-400 uppercase">
            {row.original.category}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "durationMinutes",
      header: "Продължителност",
      cell: ({ row }) => <span>{row.original.durationMinutes} мин</span>,
    },
    {
      accessorKey: "price",
      header: "Цена",
      cell: ({ row }) => <span>{formatPrice(row.original.price)}</span>,
    },
    {
      accessorKey: "zones",
      header: "Зони",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.zones?.map((zone) => (
            <span
              key={zone}
              className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium dark:bg-zinc-800"
            >
              {zone}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/finances/recovery/${row.original.id}`)}
        >
          Редактиране
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-12 pb-24 duration-700 animate-in fade-in">
      {!showPageHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-zinc-900 uppercase">
              Каталог Възстановяване
            </h3>
            <p className="text-[11px] text-zinc-400">
              Управление на процедури, пакети и сесии в Recovery Zone.
            </p>
          </div>
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
              onClick={() => router.push("/finances/recovery/new")}
              className="h-10 rounded-xl bg-zinc-950 px-6 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
            >
              <PlusCircle className="mr-2 size-3.5" strokeWidth={1.5} /> Добави
              процедура
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader
          title="Каталог Възстановяване"
          description="Управление на процедури, пакети и сесии в Recovery Zone."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Каталози", href: "/catalogs" },
            { label: "Възстановяване" },
          ]}
        >
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
              onClick={() => router.push("/finances/recovery/new")}
              className="h-12 rounded-2xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-xl shadow-zinc-200 transition-all hover:bg-zinc-800"
            >
              <PlusCircle className="mr-3 size-4" strokeWidth={1.5} /> Добави
              процедура
            </Button>
          </div>
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
              value="packages"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-500 dark:data-[state=active]:bg-zinc-800"
            >
              <PackageSearch className="mr-3 size-4" strokeWidth={1.5} /> Пакети
            </TabsTrigger>
            <TabsTrigger
              value="reservations"
              className="rounded-xl px-10 py-3 text-[11px] font-medium tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-500 dark:data-[state=active]:bg-zinc-800"
            >
              <CalendarDays className="mr-3 size-4" strokeWidth={1.5} />{" "}
              Резервации
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
              <ShoppingBag className="mr-3 size-4" strokeWidth={1.5} /> Продажби
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
            </div>
          )}
        </div>

        <TabsContent value="services" className="space-y-6 animate-in fade-in">
          {view === "grid" ? (
            <RecoveryMenu
              services={data}
              onSale={(service) => setSelectedSaleService(service)}
            />
          ) : (
            <BentoCard className="overflow-hidden rounded-5xl border border-zinc-100 bg-white p-8 shadow-none">
              <DataTable
                columns={columns}
                data={data}
                filterColumnId="name"
                filterPlaceholder="Търсене по име..."
                isLoading={false}
                emptyStateMessage="Няма намерени процедури."
                renderMobileCard={(service: ClubService) => (
                  <div className="flex flex-col gap-3 p-4 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {service.name}
                        </div>
                        <div className="mt-1 text-[10px] tracking-wider text-zinc-500 uppercase">
                          {service.category} • {service.durationMinutes} мин
                        </div>
                        {service.zones && service.zones.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {service.zones.map((zone) => (
                              <span
                                key={zone}
                                className="rounded bg-zinc-100 px-2 py-0.5 text-[9px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              >
                                {zone}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-emerald-600 dark:bg-emerald-900/30">
                          {formatPrice(service.price)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] text-zinc-500"
                          onClick={() =>
                            router.push(`/finances/recovery/${service.id}`)
                          }
                        >
                          Редакция
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              />
            </BentoCard>
          )}
        </TabsContent>

        <TabsContent value="packages" className="animate-in fade-in">
          <BentoCard className="h-[calc(100vh-16rem)] overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none">
            <RecoveryClientPackages />
          </BentoCard>
        </TabsContent>

        <TabsContent value="reservations" className="animate-in fade-in">
          <BentoCard className="h-[calc(100vh-16rem)] overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none">
            <RecoveryReservationsHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in">
          <BentoCard className="h-[calc(100vh-16rem)] overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none">
            <RecoveryHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent value="sales" className="animate-in fade-in">
          <BentoCard className="h-[calc(100vh-16rem)] overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none">
            <RecoverySalesHistory />
          </BentoCard>
        </TabsContent>
      </Tabs>
      {selectedSaleService && (
        <UnifiedSaleWizardDialog
          item={selectedSaleService}
          mode="recovery"
          isOpen={!!selectedSaleService}
          onClose={() => setSelectedSaleService(null)}
          onSaleSuccess={() => {
            setSelectedSaleService(null);
            mutate("recoveryServices");
          }}
        />
      )}
    </div>
  );
}
