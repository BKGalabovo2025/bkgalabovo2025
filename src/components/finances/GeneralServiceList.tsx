"use client";

import { Edit2, ImageIcon, Search, Trash2, Wrench } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeneralServices } from "@/hooks/useGeneralServices";
import { formatPrice } from "@/lib/currency";
import { GeneralService } from "@/types";
const EditGeneralServiceDialog = dynamic(
  () =>
    import("./EditGeneralServiceDialog").then(
      (m) => m.EditGeneralServiceDialog
    ),
  { ssr: false }
);
const UnifiedSaleWizardDialog = dynamic(
  () =>
    import("@/components/shared/wizard-v2/UnifiedSaleWizardDialog").then(
      (m) => m.UnifiedSaleWizardDialog
    ),
  { ssr: false }
);
import { toast } from "sonner";

import { deleteGeneralServiceAction } from "@/lib/actions/general-services-server";
const ReservationDialog = dynamic(
  () =>
    import("@/components/reservations/reservation-dialog").then(
      (m) => m.ReservationDialog
    ),
  { ssr: false }
);

export function GeneralServiceList() {
  const { services, isLoading, refetch } = useGeneralServices();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<GeneralService | null>(
    null
  );

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<GeneralService | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteGeneralServiceAction(serviceToDelete.id);
      if (result.success) {
        toast.success("Услугата е изтрита успешно");
        refetch();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Delete general service error:", err);
      toast.error("Възникна грешка при изтриване");
    } finally {
      setIsDeleting(false);
      setServiceToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-5xl bg-zinc-100 dark:bg-zinc-900/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="group relative mb-8 max-w-md">
        <Search
          className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary"
          strokeWidth={1.5}
        />
        <Input
          placeholder="Търсене на клубна услуга..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 rounded-2xl border border-zinc-100 bg-white pl-11 text-sm font-light shadow-none transition-all focus-visible:ring-1 focus-visible:ring-primary/30 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <BentoCard
              key={service.id}
              className="group flex flex-col overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-none transition-all duration-500 hover:shadow-xl hover:shadow-zinc-100/20 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:shadow-none"
            >
              <div className="relative flex h-64 items-center justify-center overflow-hidden border-b border-zinc-50 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-4 transition-transform duration-1000 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center bg-zinc-50 text-zinc-200 dark:bg-zinc-900 dark:text-zinc-800">
                    <ImageIcon
                      className="mb-2 size-16 opacity-20"
                      strokeWidth={1}
                    />
                    <span className="text-[10px] font-medium tracking-[0.3em] uppercase opacity-40">
                      No Image
                    </span>
                  </div>
                )}

                <div className="absolute top-6 right-6 flex translate-y-2 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-10 rounded-xl border border-zinc-100 bg-white/90 shadow-none backdrop-blur-md transition-all hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-zinc-800"
                    onClick={() => {
                      setSelectedService(service);
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit2
                      className="size-4 text-zinc-600 dark:text-zinc-400"
                      strokeWidth={1.5}
                    />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-10 rounded-xl border border-zinc-100 bg-white/90 shadow-none backdrop-blur-md transition-all hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-rose-900/20"
                    onClick={() => setServiceToDelete(service)}
                  >
                    <Trash2
                      className="size-4 text-rose-500"
                      strokeWidth={1.5}
                    />
                  </Button>
                </div>

                <div className="absolute bottom-6 left-6">
                  <div className="rounded-xl border border-zinc-100 bg-white/80 px-4 py-2 text-[11px] font-medium tracking-widest text-zinc-900 uppercase backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-white">
                    {{
                      fixed: "Фиксирана",
                      per_hour: "На час",
                      per_session: "На сесия",
                    }[service.pricingUnit] || service.pricingUnit}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-8">
                <div>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <h3 className="line-clamp-2 flex min-h-14 items-center text-lg leading-snug font-medium text-zinc-900 transition-colors group-hover:text-primary dark:text-zinc-50">
                      {service.name}
                    </h3>
                  </div>
                  <p className="mb-6 line-clamp-1 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                    Изпълнител: {service.performerName}
                  </p>
                </div>

                <div className="space-y-5 border-t border-zinc-100 pt-6 dark:border-zinc-900">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] leading-none font-medium tracking-widest text-zinc-400 uppercase">
                      Цена
                    </span>
                    <span className="text-2xl leading-none font-light tracking-tight text-zinc-900 dark:text-white">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-3">
                    {service.name.toLowerCase().includes("наем на корт") ||
                    service.id.startsWith("court_rental") ? (
                      <ReservationDialog
                        onSave={refetch}
                        initialData={{
                          courtId: 1,
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 w-full rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        >
                          Продажба
                        </Button>
                      </ReservationDialog>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedService(service);
                          setIsSaleOpen(true);
                        }}
                        className="h-11 w-full rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        Продажба
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedService(service);
                        setIsEditOpen(true);
                      }}
                      className="h-11 w-full rounded-xl border-none bg-zinc-950 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
                    >
                      Детайли
                    </Button>
                  </div>
                </div>
              </div>
            </BentoCard>
          ))
        ) : (
          <div className="col-span-full rounded-4xl border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-40 text-center dark:border-zinc-900 dark:bg-zinc-900/10">
            <Wrench
              className="mx-auto mb-8 size-16 text-zinc-200 dark:text-zinc-800"
              strokeWidth={1}
            />
            <p className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Няма намерени услуги
            </p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-4 text-[11px] font-medium tracking-widest text-emerald-500 uppercase"
              >
                Изчисти търсенето
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => !open && setServiceToDelete(null)}
      >
        <AlertDialogContent className="max-w-md rounded-5xl border-none bg-white p-10 shadow-2xl dark:bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl leading-tight font-light text-zinc-900 dark:text-white">
              Изтриване на услуга
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-4 text-sm leading-relaxed font-light text-zinc-500">
              Сигурни ли сте, че искате да изтриете услугата &quot;
              {serviceToDelete?.name}&quot;? Това действие не може да бъде
              отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-12 rounded-xl border-zinc-200 bg-white px-6 text-[11px] font-medium tracking-widest uppercase hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
            >
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="h-12 rounded-xl bg-rose-500 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-rose-600"
            >
              {isDeleting ? "Изтриване..." : "Изтрий"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditOpen && (
        <EditGeneralServiceDialog
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
          onServiceUpdate={() => {
            setIsEditOpen(false);
            setSelectedService(null);
            refetch();
          }}
        />
      )}

      {isSaleOpen && selectedService && (
        <UnifiedSaleWizardDialog
          isOpen={isSaleOpen}
          onClose={() => {
            setIsSaleOpen(false);
            setSelectedService(null);
          }}
          item={selectedService}
          mode="general"
          onSaleSuccess={() => {
            setIsSaleOpen(false);
            setSelectedService(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
