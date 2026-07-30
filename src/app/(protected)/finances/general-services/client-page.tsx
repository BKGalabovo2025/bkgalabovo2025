"use client";

import { PlusCircle } from "lucide-react";
import { useState } from "react";

import { GeneralServiceDialog } from "@/components/finances/GeneralServiceDialog";
import { GeneralServiceMenu } from "@/components/finances/GeneralServiceMenu";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useGeneralServices } from "@/hooks/useGeneralServices";
import { GeneralService } from "@/types";

interface GeneralServicesClientPageProps {
  showPageHeader?: boolean;
}

export default function GeneralServicesClientPage({
  showPageHeader = true,
}: GeneralServicesClientPageProps) {
  const { services, isLoading } = useGeneralServices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<GeneralService | null>(
    null
  );

  const handleAdd = () => {
    setSelectedService(null);
    setDialogOpen(true);
  };

  const handleEdit = (service: GeneralService) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-12 pb-24 duration-700 animate-in fade-in">
      {!showPageHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-zinc-900 uppercase">
              Клубни Услуги
            </h3>
            <p className="text-[11px] text-zinc-400">
              Каталог на допълнителните клубни услуги - наплитане на ракети,
              наем на корт и други.
            </p>
          </div>
          <Button
            onClick={handleAdd}
            className="h-10 rounded-xl bg-zinc-950 px-6 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
          >
            <PlusCircle className="mr-2 size-3.5" strokeWidth={1.5} /> Добави
            услуга
          </Button>
        </div>
      ) : (
        <PageHeader
          title="Каталог Услуги"
          description="Каталог на допълнителните клубни услуги - наплитане на ракети, наем на корт и други."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Каталози", href: "/catalogs" },
            { label: "Каталог Услуги" },
          ]}
        >
          <Button
            onClick={handleAdd}
            className="h-12 rounded-2xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-xl shadow-zinc-200 transition-all hover:bg-zinc-800"
          >
            <PlusCircle className="mr-3 size-4" strokeWidth={1.5} /> Добави
            услуга
          </Button>
        </PageHeader>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-5xl bg-zinc-100"
            />
          ))}
        </div>
      ) : (
        <GeneralServiceMenu services={services} onEdit={handleEdit} />
      )}

      <GeneralServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={selectedService}
      />
    </div>
  );
}
