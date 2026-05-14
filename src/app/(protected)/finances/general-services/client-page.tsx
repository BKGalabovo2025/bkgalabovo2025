"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { GeneralServiceMenu } from "@/components/finances/GeneralServiceMenu";
import { GeneralServiceDialog } from "@/components/finances/GeneralServiceDialog";
import { useGeneralServices } from "@/hooks/useGeneralServices";
import { GeneralService } from "@/types";

export default function GeneralServicesClientPage() {
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
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <PageHeader
        title="Каталог Услуги"
        description="Каталог на допълнителните клубни услуги - наплитане на ракети, наем на корт и други."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози", href: "/finances" },
          { label: "Каталог Услуги" },
        ]}
      >
        <Button
          onClick={handleAdd}
          className="rounded-2xl shadow-xl shadow-zinc-200 bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
        >
          <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави
          услуга
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-5xl bg-zinc-100 animate-pulse"
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
