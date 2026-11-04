"use client";

import { LayoutGrid, List, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { columns } from "@/app/(protected)/finances/services/columns";
import { Service } from "@/app/(protected)/finances/services/service.types";
import { ServiceMenu } from "@/components/finances/ServiceMenu";
import { DataTable } from "@/components/shared/data-table";
import { UnifiedSaleWizardDialog } from "@/components/shared/wizard-v2/UnifiedSaleWizardDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrainingsCatalogViewProps {
  initialServices: Service[];
}

export function TrainingsCatalogView({
  initialServices,
}: TrainingsCatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saleId = searchParams.get("sale");

  const [services] = useState<Service[]>(initialServices);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [saleService, setSaleService] = useState<Service | null>(null);

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

  const openSale = (service: Service) => {
    setSaleService(service);
    router.push(`/catalogs/trainings?sale=${service.id}`, { scroll: false });
  };

  const closeSale = () => {
    setSaleService(null);
    router.push(`/catalogs/trainings`, { scroll: false });
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

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switch */}
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "grid" | "table")}
            className="hidden rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-0.5 md:flex dark:border-zinc-800 dark:bg-zinc-900"
          >
            <TabsList className="h-8 border-none bg-transparent p-0">
              <TabsTrigger
                value="grid"
                title="Изглед Решетка"
                aria-label="Изглед Решетка"
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800"
              >
                <LayoutGrid className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger
                value="table"
                title="Изглед Таблица"
                aria-label="Изглед Таблица"
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800"
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
