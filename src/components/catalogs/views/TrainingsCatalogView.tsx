"use client";

import {
  Activity,
  Dumbbell,
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

import { columns } from "@/app/(protected)/finances/services/columns";
import { Service } from "@/app/(protected)/finances/services/service.types";
import { ServiceMenu } from "@/components/finances/ServiceMenu";
import { DataTable } from "@/components/shared/data-table";
import { UnifiedSaleWizardDialog } from "@/components/shared/wizard-v2/UnifiedSaleWizardDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/currency";

interface TrainingsCatalogViewProps {
  initialServices: Service[];
}

export function TrainingsCatalogView({
  initialServices,
}: TrainingsCatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const saleId = searchParams.get("sale");
  const qParam = searchParams.get("q") || "";
  const viewParam = searchParams.get("view") as "grid" | "table" | null;
  const itemParam = searchParams.get("item");

  const [services] = useState<Service[]>(initialServices);
  const [view, setView] = useState<"grid" | "table">(
    viewParam === "table" ? "table" : "grid"
  );
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [saleService, setSaleService] = useState<Service | null>(null);

  // Keep search term state in sync if URL changes
  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);

  // Keep view in sync if URL changes
  useEffect(() => {
    if (viewParam && (viewParam === "grid" || viewParam === "table")) {
      setView(viewParam);
    }
  }, [viewParam]);

  // Auto-scroll into view when item deep-link param is provided
  useEffect(() => {
    if (itemParam) {
      const el = document.getElementById(`item-${itemParam}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [itemParam, services]);

  // Synchronize sale modal with URL search param
  useEffect(() => {
    if (saleId) {
      const found = services.find((s) => s.id === saleId);
      if (found) {
        setSaleService(found);
      }
    } else {
      setSaleService(null);
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

  const handleViewChange = (v: "grid" | "table") => {
    setView(v);
    updateUrlParams((params) => {
      if (v === "table") params.set("view", "table");
      else params.delete("view");
    });
  };

  const handleCopyLink = (service: Service) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/catalogs/trainings?item=${service.id}`;
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

  const openSale = (service: Service) => {
    setSaleService(service);
    updateUrlParams((params) => {
      params.set("sale", service.id);
    });
  };

  const closeSale = () => {
    setSaleService(null);
    updateUrlParams((params) => {
      params.delete("sale");
    });
  };

  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return services;
    const q = searchTerm.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.type && s.type.toLowerCase().includes(q))
    );
  }, [services, searchTerm]);

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

  const handleSuccess = () => {
    router.refresh();
  };

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
            <Dumbbell className="size-4" />
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
            placeholder="Търсене на тренировъчна програма или абонамент..."
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
                title="Изглед Решетка"
                aria-label="Изглед Решетка"
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 cursor-pointer"
              >
                <LayoutGrid className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger
                value="table"
                title="Изглед Таблица"
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
            className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500"
          >
            <Link href="/catalogs/trainings/new">
              <PlusCircle className="mr-1.5 size-4" />
              <span>Добави тренировка</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {view === "grid" ? (
        <ServiceMenu
          services={filteredServices}
          selectedItemId={itemParam}
          copiedItemId={copiedItemId}
          onCopyLink={handleCopyLink}
          onEdit={(service) =>
            router.push(`/catalogs/trainings/${service.id}/edit`)
          }
          onSale={(service) => openSale(service)}
          onDeleteSuccess={handleSuccess}
        />
      ) : (
        <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <DataTable
            columns={columns}
            data={filteredServices}
            filterColumnId="name"
            filterPlaceholder="Търсене по име на услуга..."
            isLoading={false}
            emptyStateMessage="Няма намерени тренировъчни програми."
          />
        </BentoCard>
      )}

      {/* Instant Point of Sale Wizard (Deep-linked with ?sale=<id>) */}
      {saleService && (
        <UnifiedSaleWizardDialog
          item={saleService}
          mode="training"
          isOpen={!!saleService}
          onClose={closeSale}
          onSaleSuccess={() => {
            closeSale();
            handleSuccess();
          }}
        />
      )}
    </div>
  );
}
