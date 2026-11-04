"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LayoutGrid, List, PlusCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import { RecoveryMenu } from "@/components/finances/RecoveryMenu";
import { DataTable } from "@/components/shared/data-table";
import { UnifiedSaleWizardDialog } from "@/components/shared/wizard-v2/UnifiedSaleWizardDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/currency";
import { ClubService } from "@/types";

interface RecoveryCatalogViewProps {
  initialServices: ClubService[];
}

export function RecoveryCatalogView({
  initialServices,
}: RecoveryCatalogViewProps) {
  const router = useRouter();
  const [services] = useState<ClubService[]>(initialServices);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSaleService, setSelectedSaleService] =
    useState<ClubService | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ["all", ...Array.from(set)];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q));
      const matchesCategory =
        selectedCategory === "all" || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, selectedCategory]);

  const columns: ColumnDef<ClubService>[] = [
    {
      accessorKey: "name",
      header: "Име",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-zinc-900 dark:text-white">
            {row.original.name}
          </span>
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
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {formatPrice(row.original.price)}
        </span>
      ),
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
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSaleService(row.original)}
            className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
          >
            Продажба
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/finances/recovery/${row.original.id}`)}
            className="h-7 text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            Редактиране
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <Input
            placeholder="Търсене на процедура, сауна, масаж или пакет..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View Switch */}
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "grid" | "table")}
            className="hidden rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-0.5 md:flex dark:border-zinc-800 dark:bg-zinc-900"
          >
            <TabsList className="h-8 border-none bg-transparent p-0">
              <TabsTrigger
                value="grid"
                title="Решетка"
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800"
              >
                <LayoutGrid className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger
                value="table"
                title="Таблица"
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800"
              >
                <List className="size-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="sm"
            onClick={() => router.push("/finances/recovery/new")}
            className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 shrink-0"
          >
            <PlusCircle className="mr-1.5 size-4" />
            <span>Добави процедура</span>
          </Button>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 2 && (
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {cat === "all" ? "Всички категории" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Content: Grid or Table */}
      {view === "grid" ? (
        <RecoveryMenu
          services={filteredServices}
          onSale={(service) => setSelectedSaleService(service)}
        />
      ) : (
        <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <DataTable
            columns={columns}
            data={filteredServices}
            filterColumnId="name"
            filterPlaceholder="Търсене по име..."
            isLoading={false}
            emptyStateMessage="Няма намерени възстановителни процедури."
          />
        </BentoCard>
      )}

      {/* Sale Wizard */}
      {selectedSaleService && (
        <UnifiedSaleWizardDialog
          item={selectedSaleService}
          mode="recovery"
          isOpen={!!selectedSaleService}
          onClose={() => setSelectedSaleService(null)}
          onSaleSuccess={() => {
            setSelectedSaleService(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
