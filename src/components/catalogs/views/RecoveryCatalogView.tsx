"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  Layers,
  LayoutGrid,
  List,
  PlusCircle,
  Search,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const saleId = searchParams.get("sale");
  const qParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "all";
  const viewParam = searchParams.get("view") as "grid" | "table" | null;
  const itemParam = searchParams.get("item");

  const [services] = useState<ClubService[]>(initialServices);
  const [view, setView] = useState<"grid" | "table">(
    viewParam === "table" ? "table" : "grid"
  );
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(categoryParam);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [selectedSaleService, setSelectedSaleService] =
    useState<ClubService | null>(null);

  // Sync state if URL changes
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    if (viewParam && (viewParam === "grid" || viewParam === "table")) {
      setView(viewParam);
    }
  }, [viewParam]);

  // Auto-scroll when itemParam is provided
  useEffect(() => {
    if (itemParam) {
      const el = document.getElementById(`item-${itemParam}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [itemParam, services]);

  useEffect(() => {
    if (saleId && services.length > 0) {
      const found = services.find((s) => s.id === saleId);
      if (found) {
        setSelectedSaleService(found);
      }
    } else {
      setSelectedSaleService(null);
    }
  }, [saleId, services]);

  const updateUrlParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    updateUrlParams((params) => {
      if (val.trim()) params.set("q", val);
      else params.delete("q");
    });
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    updateUrlParams((params) => {
      if (cat !== "all") params.set("category", cat);
      else params.delete("category");
    });
  };

  const handleViewChange = (v: "grid" | "table") => {
    setView(v);
    updateUrlParams((params) => {
      if (v === "table") params.set("view", "table");
      else params.delete("view");
    });
  };

  const handleCopyLink = (service: ClubService) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/catalogs/recovery?item=${service.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiedItemId(service.id);
          toast.success(`Директният линк за "${service.name}" е копиран!`);
          setTimeout(() => setCopiedItemId(null), 2500);
        })
        .catch(() => {
          toast.error("Неуспешно копиране на линк.");
        });
    } else {
      setCopiedItemId(service.id);
      toast.success(`Линк: ${url}`);
      setTimeout(() => setCopiedItemId(null), 2500);
    }
  };

  const openSale = (service: ClubService) => {
    setSelectedSaleService(service);
    updateUrlParams((params) => {
      params.set("sale", service.id);
    });
  };

  const closeSale = () => {
    setSelectedSaleService(null);
    updateUrlParams((params) => {
      params.delete("sale");
    });
  };

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
      id: "actions",
      header: "Действия",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCopyLink(row.original)}
            className="h-8 text-xs font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer"
            title="Копирай директен линк"
          >
            Линк
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openSale(row.original)}
            className="h-8 text-xs font-semibold"
          >
            Продажба
          </Button>
          <Button
            size="sm"
            asChild
            className="h-8 bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            <Link href={`/catalogs/recovery/${row.original.id}/edit`}>
              Редакция
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  const kpiStats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.price >= 0).length;
    const prices = services
      .map((s) => Number(s.price) || 0)
      .filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const avgPrice =
      prices.length > 0
        ? prices.reduce((acc, p) => acc + p, 0) / prices.length
        : 0;
    return { total, active, minPrice, avgPrice };
  }, [services]);

  return (
    <div className="space-y-6">
      {/* Compact KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <BentoCard className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
              Общо позиции
            </p>
            <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-white">
              {kpiStats.total}
            </p>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
            <Layers className="size-4" />
          </div>
        </BentoCard>

        <BentoCard className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
              Активни
            </p>
            <p className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {kpiStats.active}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <Activity className="size-4" />
          </div>
        </BentoCard>

        <BentoCard className="col-span-2 flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs sm:col-span-1 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
              Мин / Средна цена
            </p>
            <p className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-white">
              {formatPrice(kpiStats.minPrice)} /{" "}
              {formatPrice(kpiStats.avgPrice)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
            <Tag className="size-4" />
          </div>
        </BentoCard>
      </div>

      {/* Top Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <Input
            placeholder="Търсене на възстановителна процедура..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="rounded-xl pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switch */}
          <Tabs
            value={view}
            onValueChange={(v) => handleViewChange(v as "grid" | "table")}
            className="hidden rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-0.5 md:flex dark:border-zinc-800 dark:bg-zinc-900"
          >
            <TabsList className="h-8 border-none bg-transparent p-0">
              <TabsTrigger
                value="grid"
                title="Решетка"
                aria-label="Изглед Решетка"
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 cursor-pointer"
              >
                <LayoutGrid className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger
                value="table"
                title="Таблица"
                aria-label="Изглед Таблица"
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 cursor-pointer"
              >
                <List className="size-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="sm"
            asChild
            className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 shrink-0"
          >
            <Link href="/catalogs/recovery/new">
              <PlusCircle className="mr-1.5 size-4" />
              <span>Добави процедура</span>
            </Link>
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
              onClick={() => handleCategoryChange(cat)}
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
          selectedItemId={itemParam}
          copiedItemId={copiedItemId}
          onCopyLink={handleCopyLink}
          onSale={(service) => openSale(service)}
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

      {/* Sale Wizard (Deep-linked with ?sale=<id>) */}
      {selectedSaleService && (
        <UnifiedSaleWizardDialog
          item={selectedSaleService}
          mode="recovery"
          isOpen={!!selectedSaleService}
          onClose={closeSale}
          onSaleSuccess={() => {
            closeSale();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
