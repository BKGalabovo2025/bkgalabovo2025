"use client";

import { useState } from "react";
import { ClubService } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { RecoveryMenu } from "@/components/finances/RecoveryMenu";
import { RecoverySaleWizardDialog } from "@/components/finances/RecoverySaleWizardDialog";
import { useSWRConfig } from "swr";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import { formatPrice } from "@/lib/currency";
import { RecoveryHistory } from "@/components/finances/RecoveryHistory";
import { RecoverySalesHistory } from "@/components/finances/RecoverySalesHistory";
import { RecoveryReservationsHistory } from "@/components/finances/RecoveryReservationsHistory";
import { RecoveryClientPackages } from "@/components/finances/RecoveryClientPackages";
import {
  History,
  ShoppingBag,
  CalendarDays,
  PackageSearch,
} from "lucide-react";

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
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
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
        <div className="flex gap-1 flex-wrap">
          {row.original.zones?.map((zone) => (
            <span
              key={zone}
              className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-medium"
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
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      {!showPageHeader ? (
        <div className="flex justify-between items-center px-2 flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
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
              onClick={() => router.push("/finances/recovery/new")}
              className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-10 px-6 font-medium text-[10px] uppercase tracking-widest transition-all"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />{" "}
              Добави процедура
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
              onClick={() => router.push("/finances/recovery/new")}
              className="rounded-2xl shadow-xl shadow-zinc-200 bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
            >
              <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави
              процедура
            </Button>
          </div>
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
              value="packages"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 transition-all py-3"
            >
              <PackageSearch className="mr-3 h-4 w-4" strokeWidth={1.5} />{" "}
              Пакети
            </TabsTrigger>
            <TabsTrigger
              value="reservations"
              className="rounded-xl px-10 font-medium text-[11px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-500 transition-all py-3"
            >
              <CalendarDays className="mr-3 h-4 w-4" strokeWidth={1.5} />{" "}
              Резервации
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
            <BentoCard className="p-8 overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl">
              <DataTable
                columns={columns}
                data={data}
                filterColumnId="name"
                filterPlaceholder="Търсене по име..."
                isLoading={false}
                emptyStateMessage="Няма намерени процедури."
              />
            </BentoCard>
          )}
        </TabsContent>

        <TabsContent value="packages" className="animate-in fade-in">
          <BentoCard className="overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl h-[calc(100vh-16rem)]">
            <RecoveryClientPackages />
          </BentoCard>
        </TabsContent>

        <TabsContent value="reservations" className="animate-in fade-in">
          <BentoCard className="overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl h-[calc(100vh-16rem)]">
            <RecoveryReservationsHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in">
          <BentoCard className="overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl h-[calc(100vh-16rem)]">
            <RecoveryHistory />
          </BentoCard>
        </TabsContent>

        <TabsContent value="sales" className="animate-in fade-in">
          <BentoCard className="overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl h-[calc(100vh-16rem)]">
            <RecoverySalesHistory />
          </BentoCard>
        </TabsContent>
      </Tabs>
      {selectedSaleService && (
        <RecoverySaleWizardDialog
          service={selectedSaleService}
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
