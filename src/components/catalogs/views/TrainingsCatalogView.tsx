"use client";

import { LayoutGrid, List, PlusCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import { columns } from "@/app/(protected)/finances/services/columns";
import { Service } from "@/app/(protected)/finances/services/service.types";
import { ServiceMenu } from "@/components/finances/ServiceMenu";
import { UnifiedTrainingDialog } from "@/components/finances/UnifiedTrainingDialog";
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
  const [services] = useState<Service[]>(initialServices);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saleService, setSaleService] = useState<Service | null>(null);

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
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800"
              >
                <LayoutGrid className="size-3.5" />
              </TabsTrigger>
              <TabsTrigger
                value="table"
                title="Изглед Таблица"
                className="h-7 rounded-lg px-2.5 data-[state=active]:bg-white data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800"
              >
                <List className="size-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500"
          >
            <PlusCircle className="mr-1.5 size-4" />
            <span>Добави тренировка</span>
          </Button>
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {view === "grid" ? (
        <ServiceMenu
          services={filteredServices}
          onEdit={(service) => setEditingService(service)}
          onSale={(service) => setSaleService(service)}
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

      {/* Add / Edit Dialogs */}
      <UnifiedTrainingDialog
        mode="add"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleSuccess}
      />

      <UnifiedTrainingDialog
        mode="edit"
        service={editingService}
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onSuccess={handleSuccess}
      />

      {/* Instant Point of Sale Wizard */}
      {saleService && (
        <UnifiedSaleWizardDialog
          item={saleService}
          mode="training"
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
